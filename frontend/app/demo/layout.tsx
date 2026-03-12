import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PopupReach — Product Demo',
  description:
    'See how PopupReach works — watch a merchant create a live promotion and a nearby customer discover and redeem it in real time.',
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
