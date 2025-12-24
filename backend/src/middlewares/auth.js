import { verifyToken } from "../utils/token.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Unauthorized: missing token" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }
    next();
  };
}
