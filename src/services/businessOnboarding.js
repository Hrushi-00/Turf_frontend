export const BUSINESS_ONBOARDING_DRAFT_KEY = "businessOnboardingDraft";

export const getBusinessOnboardingResumePath = (loginEmail) => {
  if (typeof localStorage === "undefined") return "/business";

  try {
    const rawDraft = localStorage.getItem(BUSINESS_ONBOARDING_DRAFT_KEY);
    if (!rawDraft) return "/business";

    const draft = JSON.parse(rawDraft);
    const step = Number(draft?.step);
    if (!Number.isInteger(step) || step < 0 || step > 4) return "/business";
    const savedEmail = typeof draft?.form?.email === "string" ? draft.form.email.trim().toLowerCase() : "";
    const currentEmail = typeof loginEmail === "string" ? loginEmail.trim().toLowerCase() : "";
    if (savedEmail && currentEmail && savedEmail !== currentEmail) return "/business";

    return "/business/register?resume=1";
  } catch {
    localStorage.removeItem(BUSINESS_ONBOARDING_DRAFT_KEY);
    return "/business";
  }
};
