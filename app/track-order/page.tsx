import { redirect } from 'next/navigation'

export default async function TrackOrderPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const orderId = searchParams.orderId
  const queryString = orderId ? `?orderId=${orderId}` : ''
  redirect(`/${queryString}#track-order`)
}
