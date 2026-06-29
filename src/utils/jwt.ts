import jwt from 'jsonwebtoken'

export function generateToken( userId :number, email:string){
return jwt.sign(
    {
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