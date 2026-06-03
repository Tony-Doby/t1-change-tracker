import { CheckCircle2, Circle, CircleDot, Clock, X } from 'lucide-react'

const stepNames = ['B1', 'B2', 'B3']

interface Props {
  uiStep: number
  isCompleted: boolean
  isCancelled: boolean
  isB3Locked: boolean
}

export default function RequestProgress({ uiStep, isCompleted, isCancelled, isB3Locked }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-card p-5">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">Tiến trình</h2>
      <div className="flex items-center gap-1">
        {stepNames.map((name, idx) => {
          const isDone = isCompleted || (uiStep > idx && !isCancelled)
          const isCurrent = !isCompleted && !isCancelled && uiStep === idx
          const isLocked = isB3Locked && idx === 2
          const isCancelledStep = isCancelled && idx === 2

          return (
            <div key={name} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  isDone ? 'bg-primary text-white' : isCancelledStep ? 'bg-danger text-white' : isLocked ? 'bg-neutral-100 text-neutral-400 ring-2 ring-neutral-300' : isCurrent ? 'ring-2 ring-primary bg-white text-primary' : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : isCancelledStep ? <X className="w-5 h-5" /> : isLocked ? <Clock className="w-5 h-5" /> : isCurrent ? <CircleDot className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${isCancelledStep ? 'text-danger' : isCurrent ? 'text-primary' : isDone ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {name}{isLocked ? ' (chờ)' : ''}
                </span>
              </div>
              {idx < stepNames.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-primary' : 'bg-neutral-200'}`} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
