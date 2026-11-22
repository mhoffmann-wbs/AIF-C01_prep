import { setExtended, useProgress } from '../progress/store'

const COPY = {
  practice: {
    key: 'extendedInPractice',
    label: 'Include ordering, matching and case-study questions in practice',
  },
  mock: {
    key: 'extendedInMock',
    label: 'Include ordering, matching and case-study questions in the mock exam',
  },
} as const

/**
 * The learner's choice to see the extended question kinds. Exam guide v1.2 only
 * lists multiple choice and multiple response, but AWS has used the other three
 * on this exam, so they are on by default.
 */
export function ExtendedKindsToggle({ part }: { part: keyof typeof COPY }) {
  const progress = useProgress()
  const { key, label } = COPY[part]
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" checked={progress[key]} onChange={(e) => setExtended(key, e.target.checked)} className="mt-1 accent-brand" />
      <span>
        {label}
        <span className="block text-xs text-slate-500">
          The current exam guide lists only multiple choice and multiple response, but AWS has also used these formats on AIF-C01. Each
          is scored all or nothing; each case-study question counts separately.
        </span>
      </span>
    </label>
  )
}
