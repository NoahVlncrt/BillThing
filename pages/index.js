import { useRouter } from 'next/router'
import { signIn, signOut, useSession } from 'next-auth/client'

export default function Home() {
  const [ session, loading ] = useSession()
  const router = useRouter()

  return (
    <div>
      <div className="flex-row flex justify-between items-end pl-1 pr-1 pb-2 bg-black text-white">
        <p className="text-4xl font-bold">Bill Thing</p>
        <div>
          {!session && <p onClick={() => signIn()}>Sign in</p>}
          {session && <a onClick={() => router.push('/dashboard')}><p>Dashboard</p></a>}
        </div>
      </div>
      {session && <button onClick={() => signOut()}>Sign out</button>}
    </div>
  )
}
