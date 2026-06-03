export default function DeadlineInfo({ step2ConfirmedAt, deadline3, isB3Ready, daysLeft }: { step2ConfirmedAt: string; deadline3: Date; isB3Ready: boolean; daysLeft: number }) {
  return (
    <div className="bg-white rounded-lg shadow-card p-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div><span className="text-neutral-500">Ngày xác nhận B2:</span> <span className="font-medium">{new Date(step2ConfirmedAt).toLocaleDateString('vi-VN')}</span></div>
        <div><span className="text-neutral-500">Hết hạn 3 ngày LV:</span> <span className="font-medium">{deadline3.toLocaleDateString('vi-VN')}</span></div>
        <div>
          {isB3Ready ? (
            <span className="text-success font-medium">✅ Đã đủ 3 ngày làm việc</span>
          ) : (
            <span className="text-warning font-medium">⏳ Còn {Math.max(0, daysLeft)} ngày làm việc</span>
          )}
        </div>
      </div>
    </div>
  )
}
