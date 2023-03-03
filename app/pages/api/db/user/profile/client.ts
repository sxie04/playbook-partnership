import { fetcherGET, fetcherPOST } from '@/utils/next-rest-fetcher'
import { useSWRMutationPartial, useSWRPartial } from '@/utils/swr-partial'
import type { GetUserProfileResponse, UpdateUserProfileRequest, UpdateUserProfileResponse } from "./index"
export const useGetUserProfile = useSWRPartial<GetUserProfileResponse>('/api/db/user/profile', fetcherGET<GetUserProfileResponse>)
export const useUpdateUserProfile = useSWRMutationPartial<UpdateUserProfileResponse>('/api/db/user/profile', fetcherPOST<UpdateUserProfileRequest, UpdateUserProfileResponse>)
