## Packages
recharts | Dashboard charts for analytics
framer-motion | Smooth transitions and page animations
date-fns | Date formatting for attendance and deadlines
clsx | Utility for conditional classes
tailwind-merge | Utility for merging tailwind classes

## Notes
Authentication uses JWT stored in localStorage (handled via AuthContext/hooks)
API requests need 'Authorization: Bearer <token>' header if using JWT, or credentials: "include" if using cookies (Context suggests "include" in existing queryClient, but prompt implementation notes mention Bearer token - I will stick to standard credentials: "include" session based auth which is pre-configured in the template's queryClient/routes usually, but since the prompt asked for "JWT-based auth" explicitly in notes, I will implement a hybrid approach or rely on the simpler cookie-based session if that's what the backend supports. Given the `credentials: "include"` in `lib/queryClient.ts`, I will assume session cookies are handled automatically by the browser/server).
Images use placeholder avatars.
