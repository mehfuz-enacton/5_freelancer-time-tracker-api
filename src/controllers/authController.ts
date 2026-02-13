import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import USER from "../models/user";

const generateToken = (id: string) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

  if (!secret || !expiresIn) {
    throw new Error("JWT_SECRET and JWT_EXPIRES_IN must be defined");
  }
  return jwt.sign({ id }, secret, { expiresIn });
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const { uname, email, password } = req.body;
    const checkMail = await USER.findOne({ email });
    if (checkMail)
      return res.status(400).json({ msg: "Email is already exist" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await USER.create({
      uname,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      msg: "User registered successfully, Please login for access",
      data: newUser,
    });
  } catch (error: any) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if(!email || !password)
      return res.status(400).json({ msg: "Email and password are required" });

    const user = await USER.findOne({ email }).select("+password");
    if (!user)
      return res.status(400).json({ msg: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid email or password" });

    return res.status(200).json({
      msg: "User logged in successfully",
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
