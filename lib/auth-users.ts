import bcrypt from "bcryptjs";
import type { AuthUser, UserRole } from "@/lib/auth";

interface UserRecord extends AuthUser {
  passwordHash: string;
}

const users: UserRecord[] = [
  {
    id: "1",
    username: "admin",
    fullName: "Warehouse Admin",
    role: "admin",
    passwordHash: "$2a$10$72mVml5b.pDZhNpjU0/AruwwB5hR7Nf0BPHP6PpSFi6OP.jc3Xe4K", // admin123
  },
  {
    id: "2",
    username: "staff",
    fullName: "Warehouse Staff",
    role: "staff",
    passwordHash: "$2a$10$sith9Z8beegGq7KqRYdTJ.dVr1EF.lAk2ObJis3ocWr0ZTlyvN89W", // staff123
  },
];

export function getUsers(): AuthUser[] {
  return users.map(({ passwordHash, ...rest }) => rest);
}

export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const user = users.find((u) => u.username === username);
  if (!user) return null;

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return null;

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

