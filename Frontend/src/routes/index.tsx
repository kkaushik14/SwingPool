import { createBrowserRouter } from "react-router-dom";

import { RouteErrorBoundary } from "@/components";
import { AdminLayout, AppLayout, AuthLayout, PublicLayout } from "@/layouts";

import { AdminRoute, PublicOnlyRoute, UserRoute } from "./guards";
import { routePaths } from "./paths";

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            path: routePaths.home,
            lazy: async () => {
              const module = await import("@/pages/home.page");

              return { Component: module.HomePage };
            }
          },
          {
            path: routePaths.howItWorks,
            lazy: async () => {
              const module = await import("@/pages/how-it-works.page");

              return { Component: module.HowItWorksPage };
            }
          },
          {
            path: routePaths.pricing,
            lazy: async () => {
              const module = await import("@/pages/pricing.page");

              return { Component: module.PricingPage };
            }
          },
          {
            path: routePaths.publicCharities,
            lazy: async () => {
              const module = await import("@/pages/public-charities.page");

              return { Component: module.PublicCharitiesPage };
            }
          },
          {
            path: routePaths.publicCharityDetailPattern,
            lazy: async () => {
              const module = await import("@/pages/public-charity-detail.page");

              return { Component: module.PublicCharityDetailPage };
            }
          },
          {
            path: routePaths.publicWinners,
            lazy: async () => {
              const module = await import("@/pages/winners.page");

              return { Component: module.WinnersPage };
            }
          },
          {
            path: routePaths.faq,
            lazy: async () => {
              const module = await import("@/pages/faq.page");

              return { Component: module.FaqPage };
            }
          },
          {
            path: routePaths.contact,
            lazy: async () => {
              const module = await import("@/pages/contact.page");

              return { Component: module.ContactPage };
            }
          },
          {
            path: routePaths.terms,
            lazy: async () => {
              const module = await import("@/pages/terms.page");

              return { Component: module.TermsPage };
            }
          },
          {
            path: routePaths.privacy,
            lazy: async () => {
              const module = await import("@/pages/privacy.page");

              return { Component: module.PrivacyPage };
            }
          }
        ]
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: routePaths.verifyEmail,
            lazy: async () => {
              const module = await import("@/pages/verify-email.page");

              return { Component: module.VerifyEmailPage };
            }
          },
          {
            path: routePaths.forgotPassword,
            lazy: async () => {
              const module = await import("@/pages/forgot-password.page");

              return { Component: module.ForgotPasswordPage };
            }
          },
          {
            path: routePaths.resetPassword,
            lazy: async () => {
              const module = await import("@/pages/reset-password.page");

              return { Component: module.ResetPasswordPage };
            }
          }
        ]
      },
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                path: routePaths.login,
                lazy: async () => {
                  const module = await import("@/pages/login.page");

                  return { Component: module.LoginPage };
                }
              },
              {
                path: routePaths.signup,
                lazy: async () => {
                  const module = await import("@/pages/register.page");

                  return { Component: module.RegisterPage };
                }
              },
              {
                path: routePaths.register,
                lazy: async () => {
                  const module = await import("@/pages/register.page");

                  return { Component: module.RegisterPage };
                }
              }
            ]
          }
        ]
      },
      {
        element: <UserRoute />,
        children: [
          {
            path: routePaths.app,
            element: <AppLayout />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const module = await import("@/pages/dashboard.page");

                  return { Component: module.DashboardPage };
                }
              },
              {
                path: "onboarding",
                lazy: async () => {
                  const module = await import("@/pages/onboarding.page");

                  return { Component: module.OnboardingPage };
                }
              },
              {
                path: "onboarding/profile",
                lazy: async () => {
                  const module = await import("@/pages/onboarding.page");

                  return { Component: module.OnboardingPage };
                }
              },
              {
                path: "onboarding/verify",
                lazy: async () => {
                  const module = await import("@/pages/onboarding.page");

                  return { Component: module.OnboardingPage };
                }
              },
              {
                path: "onboarding/charity-payment",
                lazy: async () => {
                  const module = await import("@/pages/onboarding.page");

                  return { Component: module.OnboardingPage };
                }
              },
              {
                path: "onboarding/success",
                lazy: async () => {
                  const module = await import("@/pages/onboarding.page");

                  return { Component: module.OnboardingPage };
                }
              },
              {
                path: "profile",
                lazy: async () => {
                  const module = await import("@/pages/profile.page");

                  return { Component: module.ProfilePage };
                }
              },
              {
                path: "subscriptions",
                lazy: async () => {
                  const module = await import("@/pages/subscriptions.page");

                  return { Component: module.SubscriptionsPage };
                }
              },
              {
                path: "subscriptions/payment/success",
                lazy: async () => {
                  const module = await import("@/pages/payment-success.page");

                  return { Component: module.PaymentSuccessPage };
                }
              },
              {
                path: "subscriptions/payment/failure",
                lazy: async () => {
                  const module = await import("@/pages/payment-failure.page");

                  return { Component: module.PaymentFailurePage };
                }
              },
              {
                path: "scores",
                lazy: async () => {
                  const module = await import("@/pages/scores.page");

                  return { Component: module.ScoresPage };
                }
              },
              {
                path: "charities",
                lazy: async () => {
                  const module = await import("@/pages/charities.page");

                  return { Component: module.CharitiesPage };
                }
              },
              {
                path: "draws",
                lazy: async () => {
                  const module = await import("@/pages/draws.page");

                  return { Component: module.DrawsPage };
                }
              },
              {
                path: "notifications",
                lazy: async () => {
                  const module = await import("@/pages/notifications.page");

                  return { Component: module.NotificationsPage };
                }
              },
              {
                path: "settings",
                lazy: async () => {
                  const module = await import("@/pages/settings.page");

                  return { Component: module.SettingsPage };
                }
              },
              {
                path: "experience-kit",
                lazy: async () => {
                  const module = await import("@/pages/experience-kit.page");

                  return { Component: module.ExperienceKitPage };
                }
              }
            ]
          }
        ]
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: routePaths.admin,
            element: <AdminLayout />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const module = await import("@/pages/admin-overview.page");

                  return { Component: module.AdminOverviewPage };
                }
              },
              {
                path: "users",
                lazy: async () => {
                  const module = await import("@/pages/admin-users.page");

                  return { Component: module.AdminUsersPage };
                }
              },
              {
                path: "revenue",
                lazy: async () => {
                  const module = await import("@/pages/admin-revenue.page");

                  return { Component: module.AdminRevenuePage };
                }
              },
              {
                path: "charities",
                lazy: async () => {
                  const module = await import("@/pages/admin-charities.page");

                  return { Component: module.AdminCharitiesPage };
                }
              },
              {
                path: "draws",
                lazy: async () => {
                  const module = await import("@/pages/admin-draws.page");

                  return { Component: module.AdminDrawsPage };
                }
              },
              {
                path: "audit",
                lazy: async () => {
                  const module = await import("@/pages/admin-audit.page");

                  return { Component: module.AdminAuditPage };
                }
              },
              {
                path: "experience-kit",
                lazy: async () => {
                  const module = await import("@/pages/experience-kit.page");

                  return { Component: module.ExperienceKitPage };
                }
              }
            ]
          }
        ]
      },
      {
        path: "*",
        lazy: async () => {
          const module = await import("@/pages/not-found.page");

          return { Component: module.NotFoundPage };
        }
      }
    ]
  }
]);

export * from "./access";
export * from "./guards";
export * from "./paths";
