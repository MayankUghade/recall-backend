import jwt from 'jsonwebtoken'

export function generateToken( username:string, userId :number, email:string){
return jwt.sign(
    {
        username,
        userId,
        email
    },
    process.env.JWT_SECRET!,
    {
        expiresIn:"7d"
    }
)
}

export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!);
}