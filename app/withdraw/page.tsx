import { redirect } from 'next/navigation'

export default function WithdrawRedirectPage() {
  redirect('/?tab=Withdraw')
}
