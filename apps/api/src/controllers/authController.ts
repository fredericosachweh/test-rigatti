import bcrypt from "bcryptjs";
import { z } from "zod";
import { Company } from "../models/Company.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/http.js";
import { signToken } from "../utils/jwt.js";

const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["admin", "cliente"]).default("cliente"),
    companyName: z.string().min(2).optional(),
    companySlug: z.string().min(2).optional()
  })
  .refine((data) => data.role === "cliente" || Boolean(data.companyName || data.companySlug), {
    message: "Informe companyName para criar empresa ou companySlug para entrar em uma existente."
  });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function serializeAuth(user: {
  _id: { toString(): string };
  companyId?: { toString(): string } | null;
  role: "admin" | "cliente";
  email: string;
  name: string;
}) {
  const companyId = user.companyId?.toString() ?? "";
  const token = signToken({
    userId: user._id.toString(),
    companyId,
    role: user.role,
    email: user.email,
    name: user.name
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      companyId,
      role: user.role,
      email: user.email,
      name: user.name
    }
  };
}

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new HttpError(409, "Ja existe um usuario com este email.");
  }

  let companyId: string | undefined;
  const role = data.companyName ? "admin" : data.role;

  if (data.companyName) {
    const slug = (data.companySlug ?? data.companyName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");

    const existingCompany = await Company.findOne({ slug });
    if (existingCompany) {
      throw new HttpError(409, "Ja existe uma empresa com este slug.");
    }

    const company = await Company.create({
      name: data.companyName,
      slug
    });

    companyId = company._id.toString();
  } else if (data.companySlug) {
    const company = await Company.findOne({ slug: data.companySlug.toLowerCase().trim() });

    if (!company) {
      throw new HttpError(404, "Empresa nao encontrada para o slug informado.");
    }

    companyId = company._id.toString();
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role,
    ...(companyId ? { companyId } : {})
  });

  res.status(201).json(serializeAuth(user));
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email.toLowerCase() });
  if (!user) {
    throw new HttpError(401, "Credenciais invalidas.");
  }

  const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValidPassword) {
    throw new HttpError(401, "Credenciais invalidas.");
  }

  res.json(serializeAuth(user));
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new HttpError(401, "Usuario nao autenticado.");
  }

  res.json({
    user: {
      id: req.user.userId,
      companyId: req.user.companyId,
      role: req.user.role,
      email: req.user.email,
      name: req.user.name
    }
  });
});
