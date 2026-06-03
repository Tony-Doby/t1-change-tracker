import { formatDateTime } from '../../lib/date-utils'

interface Comment {
  id: string
  content: string
  created_by: string | null
  created_at: string
}

export default function RequestComments({
  comments,
  currentUserId,
  newComment,
  onChange,
  onSubmit,
  canComment,
}: {
  comments: Comment[]
  currentUserId?: string | null
  newComment: string
  onChange: (val: string) => void
  onSubmit: () => void
  canComment: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-card p-5">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">💬 Thảo luận</h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
        {comments.map((c) => (
          <div key={c.id} className={`flex gap-3 ${c.created_by === currentUserId ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c.created_by === currentUserId ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-700'}`}>A</div>
            <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${c.created_by === currentUserId ? 'bg-primary-light text-neutral-900' : 'bg-neutral-50 text-neutral-900'}`}>
              <p>{c.content}</p>
              <p className={`text-[10px] mt-1 ${c.created_by === currentUserId ? 'text-primary/70' : 'text-neutral-400'}`}>{formatDateTime(c.created_at)}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-neutral-500 italic">Chưa có bình luận nào</p>}
      </div>
      {canComment && (
        <div className="mt-4 flex gap-2">
          <textarea value={newComment} onChange={(e) => onChange(e.target.value)} placeholder="Nhập ghi chú..." rows={2}
            className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light resize-none" />
          <button onClick={onSubmit} disabled={!newComment.trim()} className="px-4 h-auto bg-primary text-white rounded-md text-sm hover:bg-primary-hover disabled:opacity-50">Gửi</button>
        </div>
      )}
    </div>
  )
}
