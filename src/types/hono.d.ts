import type { Context } from "hono";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useContext(ctx: Context) {
  const user = ctx.get("user");
  console.log(user?.id, user?.email);
}


declare module "hono" {
  interface ContextVariableMap {
    user: {
      id: string;
      email: string;
    };
  }
}