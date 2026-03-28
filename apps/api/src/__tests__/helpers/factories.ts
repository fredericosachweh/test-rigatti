import bcrypt from "bcryptjs";
import { Company } from "../../models/Company.js";
import { Product } from "../../models/Product.js";
import { User } from "../../models/User.js";
import { signToken } from "../../utils/jwt.js";

export async function createCompany(overrides: Record<string, unknown> = {}) {
  return Company.create({ name: "Test Company", slug: "test-company", ...overrides });
}

export async function createAdmin(companyId: unknown, overrides: Record<string, unknown> = {}) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return User.create({
    name: "Admin User",
    email: "admin@test.com",
    passwordHash,
    role: "admin",
    companyId,
    ...overrides
  });
}

export async function createCliente(overrides: Record<string, unknown> = {}) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return User.create({
    name: "Cliente User",
    email: "cliente@test.com",
    passwordHash,
    role: "cliente",
    ...overrides
  });
}

export function tokenFor(user: {
  _id: { toString(): string };
  companyId?: { toString(): string } | null;
  role: "admin" | "cliente";
  email: string;
  name: string;
}) {
  return signToken({
    userId: user._id.toString(),
    companyId: user.companyId?.toString() ?? "",
    role: user.role,
    email: user.email,
    name: user.name
  });
}

export async function createProduct(companyId: unknown, overrides: Record<string, unknown> = {}) {
  return Product.create({
    name: "Test Product",
    description: "A test product description long enough",
    price: 100,
    category: "Test Category",
    companyId,
    images: [
      {
        imageUrl: "/uploads/products/original/test.webp",
        thumbnailUrl: "/uploads/products/thumb/test.webp"
      }
    ],
    ...overrides
  });
}
