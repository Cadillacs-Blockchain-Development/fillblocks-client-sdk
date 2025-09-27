import axios from 'axios';

export interface OrganizationData {
  organizationOwner: string;
  organizationName: string;
  aboutMe: string;
  teamSize: number;
}

export interface OrganizationResponse {
  success: boolean;
  organization: {
    _id: string;
    organizationOwner: string;
    organizationName: string;
    aboutMe: string;
    teamSize: number;
    createdAt: string;
    updatedAt: string;
    clientId: string;
    secretKey: string;
    wallet: string;
    walletPrivateKey: string;
    status: string;
    schemas: any[];
    __v: number;
  };
}

export const createOrganization = async (
  orgData: OrganizationData,
  token?: string
): Promise<OrganizationResponse> => {
  const baseUrl = import.meta.env.VITE_BASE_URL as string;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add token to headers if provided
  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await axios.post(`${baseUrl}/organization/create`, orgData, {
    headers,
    withCredentials: true,
  });

  return response.data;
};
