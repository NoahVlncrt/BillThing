import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'
import jwt from 'jsonwebtoken'
import { request, GraphQLClient } from 'graphql-request';
import useSWR from 'swr';

const client = new GraphQLClient('https://billthing.hasura.app/v1/graphql', { headers: {'x-hasura-admin-secret': process.env.hasura_admin_key} })

const CREATE_USER = `
  mutation createUser($name: String!, $email: String!, $id: String!){
    insert_User_one(object: {email: $email, id: $id, name: $name}){
      id
      name
    }
  }
`

const CHECK_IF_NEW = `
  query checkUser($id: String!){
    User_aggregate(where: {id: {_eq: $id}}) {
      aggregate {
        count
      }
    }
  }
`

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET
    })
    // ...add more providers here
  ],
  debug: false,
  jwt: {
    // A secret to use for key generation (you should set this explicitly)
    secret: process.env.SECRET,
    // Set to true to use encryption (default: false)
    // encryption: true,
    // You can define your own encode/decode functions for signing and encryption
    // if you want to override the default behaviour.
    encode: async ({ secret, token, maxAge }) => {
      const jwtClaims = {
        sub: token.sub,
        name: token.name,
        email: token.email,
        iat: Date.now() / 1000,
        exp: Math.floor(Date.now() / 1000) + (24*60*60),
        'https://hasura.io/jwt/claims': {
          "x-hasura-allowed-roles": ["admin", "user"],
          "x-hasura-default-role": "user",
          "x-hasura-role": "user",
          "x-hasura-user-id": token.sub,
        },
      };
      const encodedToken = jwt.sign(jwtClaims, secret, { algorithm: 'HS256'});
      return encodedToken;
    },
    decode: async ({ secret, token, maxAge }) => {
      const decodedToken = jwt.verify(token, secret, { algorithms: ['HS256']});
      return decodedToken;
    },
  },
  callbacks: {
    async session(session, token) {
        const encodedToken = jwt.sign(token, process.env.SECRET, { algorithm: 'HS256'});
        session.id = token.id;
        session.token = encodedToken;
        return Promise.resolve(session);
    },
    async jwt(token, user, account, profile) { 
        const isUserSignedIn = user ? true : false;
        // Checks if user exists in the database via an API call
        let isNewUser = await client.request(CHECK_IF_NEW, {id: token.sub})

        if(isUserSignedIn && isNewUser.User_aggregate.aggregate.count === 0){
          //if the user is signed in and they don't exist in the database create a new user
          let variables = {
            email: token.email, 
            id: token.sub,
            name: token.name
          }
          client.request(CREATE_USER, variables).then((data) => console.log(data));
        }
        
        return Promise.resolve(token);
    }
  }
})