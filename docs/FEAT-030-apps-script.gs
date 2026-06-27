/**
 * FEAT-030: Google Drive Admin Panel — Apps Script Web App
 *
 * Cách triển khai:
 * 1. Tạo project mới tại https://script.google.com
 * 2. Dán toàn bộ file này vào Code.gs
 * 3. Bật Advanced Service: Extensions → Services → Google Drive API (v3)
 * 4. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Copy URL, dán vào biến APPS_SCRIPT_WEB_APP_URL của Supabase Edge Function
 * 5. (Khuyến nghị) Tạo script property APPS_SCRIPT_TOKEN để bảo mật URL.
 *    Edge Function sẽ gửi token này trong field authToken.
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData?.contents || '{}')
    const { action, params = {}, authToken } = body

    // Optional shared-secret check
    const expectedToken = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_TOKEN')
    if (expectedToken && authToken !== expectedToken) {
      return jsonResponse({ success: false, error: 'Unauthorized: invalid or missing token' })
    }

    if (!action) {
      return jsonResponse({ success: false, error: 'Missing action' })
    }

    let data
    switch (action) {
      case 'scanFolders':
        data = scanFolders(params)
        break
      case 'setPermissions':
        data = setPermissions(params)
        break
      case 'createFolder':
        data = createFolder(params)
        break
      case 'createFolderTree':
        data = createFolderTree(params)
        break
      case 'copyFolder':
        data = copyFolder(params)
        break
      case 'listItems':
        data = listItems(params)
        break
      case 'moveItem':
        data = moveItem(params)
        break
      case 'removePermission':
        data = removePermission(params)
        break
      case 'deleteItem':
        data = deleteItem(params)
        break
      case 'detectDriveTypes':
        data = detectDriveTypes(params)
        break
      default:
        throw new Error('Unknown action: ' + action)
    }

    return jsonResponse({ success: true, data })
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || String(err) })
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}

// ===========================
// Helpers
// ===========================

function getDriveItem(id) {
  try {
    return DriveApp.getFolderById(id)
  } catch (e) {
    try {
      return DriveApp.getFileById(id)
    } catch (e2) {
      throw new Error('Không tìm thấy hoặc không truy cập được item: ' + id)
    }
  }
}

function matches(name, matchType, pattern) {
  if (!pattern) return true
  switch (matchType) {
    case 'exact':
      return name === pattern
    case 'contains':
      return name.indexOf(pattern) !== -1
    case 'startsWith':
      return name.indexOf(pattern) === 0
    case 'endsWith':
      return name.slice(-pattern.length) === pattern
    case 'regex':
      try {
        return new RegExp(pattern).test(name)
      } catch (e) {
        return false
      }
    default:
      return name.indexOf(pattern) !== -1
  }
}

// ===========================
// Actions
// ===========================

function scanFolders(params) {
  const rootFolderId = params.rootFolderId
  const depth = Math.min(10, Math.max(0, Number(params.depth ?? 1)))
  const matchType = params.matchType || 'contains'
  const pattern = params.pattern || ''

  // FEAT-031/032: Phát hiện loại Drive 1 lần ở gốc. Mọi folder con trong cùng cây
  // luôn cùng loại Drive (My Drive vs Shared Drive), nên không cần gọi lại cho từng item.
  let driveId = null
  try {
    const meta = Drive.Files.get(rootFolderId, { fields: 'driveId', supportsAllDrives: true })
    driveId = meta.driveId || null
  } catch (e) {
    driveId = null
  }
  const isSharedDrive = !!driveId

  const root = DriveApp.getFolderById(rootFolderId)
  const results = []
  collectFolders(root, '', 0, depth, matchType, pattern, results, driveId, isSharedDrive)
  return results
}

function collectFolders(folder, path, currentDepth, maxDepth, matchType, pattern, results, driveId, isSharedDrive) {
  const name = folder.getName()
  const fullPath = path ? path + '/' + name : name

  if (matches(name, matchType, pattern)) {
    results.push({
      id: folder.getId(),
      name: name,
      path: fullPath,
      depth: currentDepth,
      url: 'https://drive.google.com/drive/folders/' + folder.getId(),
      driveId: driveId,
      isSharedDrive: isSharedDrive,
    })
  }

  if (currentDepth >= maxDepth) return

  const subFolders = folder.getFolders()
  while (subFolders.hasNext()) {
    collectFolders(subFolders.next(), fullPath, currentDepth + 1, maxDepth, matchType, pattern, results, driveId, isSharedDrive)
  }
}

// FEAT-031: Phát hiện loại Drive (My Drive vs Shared Drive) cho từng item.
// driveId có giá trị => item nằm trong Shared Drive.
function detectDriveTypes(params) {
  const itemIds = params.itemIds || []
  return itemIds.map(function (id) {
    try {
      const f = Drive.Files.get(id, { fields: 'id,name,driveId', supportsAllDrives: true })
      return { id: id, name: f.name, isSharedDrive: !!f.driveId }
    } catch (e) {
      return { id: id, isSharedDrive: false, error: String(e) }
    }
  })
}

// FEAT-031: Cấp quyền linh hoạt qua Advanced Drive Service (1 code path cho cả 2 loại Drive).
// - scope 'user': cấp cho từng email (type=user)
// - scope 'anyone': bất kỳ ai có link (type=anyone, allowFileDiscovery=false)
// - role fileOrganizer/organizer chỉ hợp lệ cho item trong Shared Drive => validate trước.
function setPermissions(params) {
  const itemIds = params.itemIds || []
  const emails = params.emails || []
  const role = params.role || 'reader'
  const scope = params.scope || 'user'
  const SHARED_ONLY = { fileOrganizer: true, organizer: true }
  const results = []

  for (const id of itemIds) {
    try {
      if (SHARED_ONLY[role]) {
        const f = Drive.Files.get(id, { fields: 'driveId', supportsAllDrives: true })
        if (!f.driveId) {
          throw new Error('Role "' + role + '" chỉ áp dụng cho item trong Shared Drive')
        }
      }

      if (scope === 'anyone') {
        Drive.Permissions.create(
          { type: 'anyone', role: role, allowFileDiscovery: false },
          id,
          { supportsAllDrives: true }
        )
        results.push({ id: id, scope: scope, role: role, success: true })
      } else {
        if (emails.length === 0) {
          throw new Error('scope "user" yêu cầu ít nhất một email')
        }
        for (const email of emails) {
          Drive.Permissions.create(
            { type: 'user', role: role, emailAddress: email },
            id,
            { supportsAllDrives: true, sendNotificationEmail: false }
          )
          results.push({ id: id, scope: scope, email: email, role: role, success: true })
        }
      }
    } catch (e) {
      results.push({ id: id, scope: scope, role: role, success: false, error: String(e) })
    }
  }
  return results
}

function createFolder(params) {
  const parentFolderId = params.parentFolderId
  const name = params.name
  const parent = DriveApp.getFolderById(parentFolderId)
  const newFolder = parent.createFolder(name)
  return {
    id: newFolder.getId(),
    name: newFolder.getName(),
    parentFolderId: parentFolderId,
    url: 'https://drive.google.com/drive/folders/' + newFolder.getId(),
  }
}

// FEAT-034 / BUG-040: Create a folder tree from a template.
// `params.template` LÀ node gốc trực tiếp (khớp type CreateFolderTreeParams.template:
//   DriveTemplateFolder và payload frontend gửi `template: template.root`):
//   { name, permissions: [{ email|scope, role }], children: [ ...same shape ] }
// Dùng Advanced Drive Service (Drive.Files.create + supportsAllDrives) để chạy được
// cả My Drive lẫn Shared Drive. Google Drive tự kế thừa quyền cha → con; áp lại quyền
// từ template là idempotent nên không cần so sánh quyền kế thừa (DriveApp.getPermissions
// hay lỗi trên Shared Drive).
function createFolderTree(params) {
  const parentFolderId = params.parentFolderId
  const rootTemplate = params.template

  if (!rootTemplate || !rootTemplate.name) {
    throw new Error('Template thiếu root folder')
  }

  const createdNodes = []

  function createNode(templateNode, parentId, depth) {
    const created = Drive.Files.create(
      {
        name: templateNode.name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      null,
      { supportsAllDrives: true }
    )

    const node = {
      id: created.id,
      name: created.name,
      depth: depth,
      parentFolderId: parentId,
      url: 'https://drive.google.com/drive/folders/' + created.id,
      permissionsApplied: [],
    }
    createdNodes.push(node)

    const permissions = templateNode.permissions || []
    permissions.forEach(function (perm) {
      try {
        // Validate Shared Drive-only roles.
        const SHARED_ONLY = { fileOrganizer: true, organizer: true }
        if (SHARED_ONLY[perm.role]) {
          const meta = Drive.Files.get(node.id, { fields: 'driveId', supportsAllDrives: true })
          if (!meta.driveId) {
            throw new Error('Role "' + perm.role + '" chỉ áp dụng cho item trong Shared Drive')
          }
        }

        if (perm.scope === 'anyone') {
          Drive.Permissions.create(
            { type: 'anyone', role: perm.role, allowFileDiscovery: false },
            node.id,
            { supportsAllDrives: true }
          )
        } else {
          Drive.Permissions.create(
            { type: 'user', role: perm.role, emailAddress: perm.email },
            node.id,
            { supportsAllDrives: true, sendNotificationEmail: false }
          )
        }

        node.permissionsApplied.push({ email: perm.email, scope: perm.scope, role: perm.role })
      } catch (e) {
        node.permissionsApplied.push({
          email: perm.email,
          scope: perm.scope,
          role: perm.role,
          error: String(e),
        })
      }
    })

    // Recursively create children inside the node we just created.
    const children = templateNode.children || []
    children.forEach(function (child) {
      createNode(child, node.id, depth + 1)
    })

    return node
  }

  createNode(rootTemplate, parentFolderId, 0)

  return {
    parentFolderId: parentFolderId,
    nodes: createdNodes,
  }
}

function copyFolder(params) {
  const sourceFolderId = params.sourceFolderId
  const destFolderId = params.destFolderId
  const newName = params.newName

  const source = DriveApp.getFolderById(sourceFolderId)
  const dest = DriveApp.getFolderById(destFolderId)
  const copied = copyFolderRecursive(source, dest, newName)

  return {
    id: copied.getId(),
    name: copied.getName(),
    parentFolderId: destFolderId,
    url: 'https://drive.google.com/drive/folders/' + copied.getId(),
  }
}

function copyFolderRecursive(source, destParent, newName) {
  const copied = destParent.createFolder(newName || source.getName())

  const files = source.getFiles()
  while (files.hasNext()) {
    const file = files.next()
    file.makeCopy(file.getName(), copied)
  }

  const folders = source.getFolders()
  while (folders.hasNext()) {
    const sub = folders.next()
    copyFolderRecursive(sub, copied, sub.getName())
  }

  return copied
}

function listItems(params) {
  const folderId = params.folderId
  const pageSize = Math.min(1000, Math.max(1, Number(params.pageSize ?? 100)))

  const folder = DriveApp.getFolderById(folderId)
  const items = []
  let count = 0

  const files = folder.getFiles()
  while (files.hasNext() && count < pageSize) {
    const file = files.next()
    items.push({
      id: file.getId(),
      name: file.getName(),
      type: 'file',
      mimeType: file.getMimeType(),
      size: file.getSize(),
      lastUpdated: file.getLastUpdated().toISOString(),
      url: 'https://drive.google.com/file/d/' + file.getId() + '/view',
    })
    count++
  }

  const folders = folder.getFolders()
  while (folders.hasNext() && count < pageSize) {
    const sub = folders.next()
    items.push({
      id: sub.getId(),
      name: sub.getName(),
      type: 'folder',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      lastUpdated: null,
      url: 'https://drive.google.com/drive/folders/' + sub.getId(),
    })
    count++
  }

  return items
}

function moveItem(params) {
  const itemId = params.itemId
  const destFolderId = params.destFolderId

  // Yêu cầu bật Advanced Drive Service
  const file = Drive.Files.get(itemId, { fields: 'id, name, mimeType, parents' })
  const oldParentIds = file.parents || []

  const options = { addParents: destFolderId }
  if (oldParentIds.length > 0) {
    options.removeParents = oldParentIds.join(',')
  }

  const moved = Drive.Files.update({}, itemId, options)
  return {
    id: moved.id,
    name: moved.name,
    destFolderId: destFolderId,
    oldParentIds: oldParentIds,
  }
}

function removePermission(params) {
  const itemId = params.itemId
  const email = params.email

  // Yêu cầu bật Advanced Drive Service
  const list = Drive.Permissions.list(itemId, { fields: 'permissions(id,emailAddress)' })
  const permissions = list.permissions || []
  const target = permissions.find(function (p) {
    return p.emailAddress === email
  })

  if (!target) {
    throw new Error('Không tìm thấy quyền của email: ' + email)
  }

  Drive.Permissions.delete(itemId, target.id)
  return { itemId: itemId, email: email, permissionId: target.id }
}

function deleteItem(params) {
  const itemId = params.itemId

  // Yêu cầu bật Advanced Drive Service
  Drive.Files.update({ trashed: true }, itemId)
  return { itemId: itemId, trashed: true }
}
