import { type Request, type Response, type NextFunction } from "express";
import { storage } from "../storage"; // Adjust path as necessary
import { 业务逻辑 } from "path"; // This seems to be a placeholder, will remove or clarify

// Define a custom property on Express's Request type to hold user info
// This assumes you have a preceding middleware that authenticates the user
// and attaches user information (like ID) to req.user or a similar property.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string; // Assuming user ID is a string
        // Add other user properties if available and needed
      };
    }
  }
}

const FREE_PLAN_PLAYLIST_LIMIT = 3;

export const checkSubscriptionLimits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Ensure req.user and req.user.id are available.
  // This depends on your authentication middleware (e.g., Replit Auth, Passport.js).
  // For Replit Auth, user ID is typically in req.user.id if using the standard middleware.
  // If you are using `replitUser({ raiseOnNotAuthed: false })`, then req.user might be null.
  // If you are using `replitUser()`, it will throw if not authed.
  // From server/routes.ts, it seems user ID is in req.user.claims.sub

  const userId = req.user?.claims?.sub as string | undefined;

  if (!userId) {
    // If no user ID, it might be an unauthenticated request or an issue with auth middleware.
    // Depending on your app's logic, you might allow this or send an error.
    // For subscription checks, a user ID is essential.
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  try {
    const subscriptionInfo = await storage.getUserSubscriptionInfo(userId);

    // Default to 'free' if no subscription info is found, though this case should ideally be handled
    // by ensuring every user has at least a default 'free' plan status in the DB.
    const plan = subscriptionInfo?.subscriptionPlan || "free";
    const trialEndDate = subscriptionInfo?.trialEndDate;
    const subscriptionStatus = subscriptionInfo?.subscriptionStatus;

    // Check if user is in an active trial period
    const now = new Date();
    const isInTrial = trialEndDate && trialEndDate > now;

    // If user is on a paid plan (and not just in trial for a free plan, which shouldn't be a case)
    // or if their subscription status is 'active' (or similar positive status like 'trialing')
    // they should generally bypass the free plan limits.
    // 'active' usually means payment is up-to-date.
    // 'trialing' means they are in a trial for a paid plan.
    if ((plan !== "free" && subscriptionStatus === "active") || isInTrial) {
      // Users on paid plans (Premium, Pro) or in an active trial for such have unlimited playlists
      return next();
    }

    // Only apply limits if the user is on the 'free' plan and not in an active trial for a paid plan
    if (plan === "free" && !isInTrial) {
      const currentMonthYear = now.toISOString().slice(0, 7); // Format YYYY-MM
      const usage = await storage.getOrCreateUserUsage(
        userId,
        currentMonthYear,
      );

      if (usage.playlistsCreated >= FREE_PLAN_PLAYLIST_LIMIT) {
        return res.status(429).json({
          message: `Você atingiu o limite de ${FREE_PLAN_PLAYLIST_LIMIT} playlists gratuitas para este mês. Faça upgrade para Premium para playlists ilimitadas!`,
          upgrade_required: true,
        });
      }
    }

    // If all checks pass (or don't apply), proceed to the next middleware/handler
    next();
  } catch (error) {
    console.error("Erro ao verificar os limites da assinatura:", error);
    return res
      .status(500)
      .json({
        message: "Erro interno ao verificar os limites da sua assinatura.",
      });
  }
};
