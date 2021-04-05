import { signIn, signOut, getSession } from 'next-auth/client'



export default function Dashboard(props){

    return (
        <div>
            <div>
                <p>Welcome Back, {props.session.user.name}</p>
            </div>
        </div>
    )
}

export async function getServerSideProps(context) {
    return {
        props: {
            session: await getSession(context)
        }
    }
}