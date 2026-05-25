import type { ApiSuccessResponse } from "./api";
import type { AuthResult, AuthTokenPair, LoginPayload, RegisterPayload } from "./auth";
import type {
  CharityDonationRecord,
  CharityRecord,
  CharitySelectionRecord
} from "./charity";
import type { HealthStatus } from "./health";
import type { NotificationRecord } from "./notification";
import type { PaymentRecord } from "./payment";
import type { OverviewReport } from "./report";
import type { ScoreEligibilityState, ScoreQualifyingView, ScoreRecord } from "./score";
import type {
  SubscriptionConfig,
  SubscriptionCreateResult,
  SubscriptionPlan,
  SubscriptionRecord
} from "./subscription";
import type { ProfileVerificationState, UserProfile, UserRecord } from "./user";
import type { WinnerRecord } from "./winner";

export interface BackendContract {
  "/health": {
    GET: {
      response: HealthStatus;
    };
  };
  "/auth/register": {
    POST: {
      body: RegisterPayload;
      response: AuthResult;
    };
  };
  "/auth/login": {
    POST: {
      body: LoginPayload;
      response: AuthResult;
    };
  };
  "/auth/logout": {
    POST: {
      body: {
        refreshToken: string;
      };
      response: {
        loggedOut: boolean;
      };
    };
  };
  "/auth/refresh": {
    POST: {
      body: {
        refreshToken: string;
      };
      response: {
        tokens: AuthTokenPair;
      };
    };
  };
  "/auth/me": {
    GET: {
      response: UserRecord;
    };
  };
  "/auth/verify-email": {
    POST: {
      body: {
        token: string;
      };
      response: {
        verified: boolean;
        user: UserRecord;
      };
    };
  };
  "/auth/resend-verification": {
    POST: {
      body: {
        email: string;
      };
      response: {
        dispatched: boolean;
      };
    };
  };
  "/auth/forgot-password": {
    POST: {
      body: {
        email: string;
      };
      response: {
        dispatched: boolean;
      };
    };
  };
  "/auth/reset-password": {
    POST: {
      body: {
        token: string;
        newPassword: string;
      };
      response: {
        reset: boolean;
      };
    };
  };
  "/users/me": {
    GET: {
      response: UserRecord;
    };
  };
  "/users/me/profile": {
    PATCH: {
      body: Partial<UserProfile>;
      response: UserRecord;
    };
  };
  "/users/me/profile-status": {
    GET: {
      response: ProfileVerificationState;
    };
  };
  "/subscriptions/plans": {
    GET: {
      response: SubscriptionPlan[];
    };
  };
  "/subscriptions/config": {
    GET: {
      response: SubscriptionConfig;
    };
  };
  "/subscriptions/mine": {
    GET: {
      response: SubscriptionRecord[];
    };
  };
  "/subscriptions": {
    POST: {
      body: {
        planCode: string;
        charityId?: string;
        couponCode?: string;
        optionalDonationInr?: number;
        metadata?: Record<string, string | number | boolean>;
      };
      response: SubscriptionCreateResult;
    };
  };
  "/payments/mine": {
    GET: {
      response: PaymentRecord[];
    };
  };
  "/charities": {
    GET: {
      response: CharityRecord[];
    };
  };
  "/charities/my/selection": {
    GET: {
      response: CharitySelectionRecord | null;
    };
    POST: {
      body: {
        charityId: string;
        reason?: string;
      };
      response: CharitySelectionRecord;
    };
  };
  "/charities/my/donations": {
    GET: {
      response: CharityDonationRecord[];
    };
  };
  "/scores/mine": {
    GET: {
      response: ScoreRecord[];
    };
  };
  "/scores/mine/competition/qualifying": {
    GET: {
      response: ScoreQualifyingView;
    };
  };
  "/scores/mine/competition/eligibility": {
    GET: {
      response: ScoreEligibilityState;
    };
  };
  "/scores": {
    POST: {
      body: {
        playedDate: string;
        value: number;
        contestNumber: number;
        metadata?: Record<string, string | number | boolean>;
      };
      response: ScoreRecord;
    };
  };
  "/notifications/mine": {
    GET: {
      response: NotificationRecord[];
    };
  };
  "/winners/mine": {
    GET: {
      response: WinnerRecord[];
    };
  };
  "/reports/overview": {
    GET: {
      response: OverviewReport;
    };
  };
}

type DynamicBackendPath = `/notifications/${string}`;

export type BackendPath = keyof BackendContract | DynamicBackendPath;

type StaticBackendPath = keyof BackendContract;

export type BackendMethod<TPath extends BackendPath> =
  TPath extends StaticBackendPath
    ? keyof BackendContract[TPath] & string
    : TPath extends DynamicBackendPath
      ? "PATCH"
      : never;

type DynamicBackendEntry = {
  PATCH: {
    body: Partial<NotificationRecord>;
    response: NotificationRecord;
  };
};

type BackendContractEntry<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = TPath extends StaticBackendPath
  ? BackendContract[TPath][Extract<TMethod, keyof BackendContract[TPath] & string>]
  : TPath extends DynamicBackendPath
    ? DynamicBackendEntry[Extract<TMethod, keyof DynamicBackendEntry>]
    : never;

export type BackendRequestBody<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = BackendContractEntry<TPath, TMethod> extends {
  body: infer TBody;
}
  ? TBody
  : never;

export type BackendResponseData<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = BackendContractEntry<TPath, TMethod> extends {
  response: infer TResponse;
}
  ? TResponse
  : never;

export type ContractEnvelope<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = ApiSuccessResponse<BackendResponseData<TPath, TMethod>>;

export type BackendRequestOptions<
  TPath extends BackendPath,
  TMethod extends BackendMethod<TPath>
> = {
  path: TPath;
  method: TMethod;
} & (BackendContractEntry<TPath, TMethod> extends {
    body: infer TBody;
  }
    ? {
        body: TBody;
      }
    : {
        body?: never;
      });
