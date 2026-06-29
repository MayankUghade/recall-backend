import { Request, Response } from "express"
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { generateToken } from "../utils/jwt";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(
      user.username,
      user.id,
      user.email
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const login = async(req:Request, res:Response)=>{
    try {
        const {email, password} = req.body

  const user = await prisma.user.findUnique({
    where:{
        email,
    }
  })

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isValid = await bcrypt.compare(
        password, user.password
    )

    if(!isValid){
        return res.status(404).json({
        message: "Incorrect credentials",
      });
    }

    const token = generateToken(
      user.username,
      user.id,
      user.email
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
    } catch (error) {
      res.status(500).json({
      message: "Something went wrong",
    });
    }
}
