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

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
  organizationId: string;
}

export interface OrganizationProjectsResponse {
  success: boolean;
  message: string;
  projects?: Project[];
  organization?: any[];
  organizationId?: string;
  total?: number;
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

export interface OrganizationDataResponse {
  success: boolean;
  organization: {
    _id: string;
    organizationOwner: {
      _id: string;
      email: string;
      name: string;
      profileUrl: string;
      isEmailVerified: boolean;
      status: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
    };
    organizationName: string;
    aboutMe: string;
    teamSize: number;
    schemas: any[];
    clientId: string;
    secretKey: string;
    wallet: string;
    walletPrivateKey: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

export const getOrganizationProjects = async (
  orgId: string,
  token?: string
): Promise<OrganizationProjectsResponse> => {
  const baseUrl = import.meta.env.VITE_BASE_URL as string;
  console.log('VITE_BASE_URL:', baseUrl);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add token to headers if provided
  if (token) {
    headers['x-auth-token'] = token;
  }

  // Use the same endpoint as getOrganizationData for consistency
  const apiUrl = baseUrl ? `${baseUrl}/organization/${orgId}` : `https://hack-server.philblocks.com/api/organization/${orgId}`;
  console.log('API URL:', apiUrl);
  
  const response = await axios.get(apiUrl, {
    headers,
    withCredentials: true,
  });

  return response.data;
};

export const getOrganizationData = async (
  userId: string,
  token?: string
): Promise<OrganizationDataResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add token to headers if provided
  if (token) {
    headers['x-auth-token'] = token;
  }
console.log(userId,"userId")
  const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/organization/${userId}`, {
    headers,
    withCredentials: true,
  });

  return response.data;
};



export const getSchemas = async (token?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await axios.get(
    `${import.meta.env.VITE_BASE_URL}/arwaves/schemas/unique`,
    {
      headers,
      withCredentials: true,
    }
  );

  const uniqueSchemas = response.data.uniqueSchemas;
  const allSchemasData = [];

  if (uniqueSchemas && uniqueSchemas.length > 0) {
    // Fetch data for each schema type
    for (const schemaName of uniqueSchemas) {
      try {
        const schemaResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/arwaves/schema/${schemaName}`,
          {
            headers,
            withCredentials: true,
          }
        );

        allSchemasData.push({
          schema: schemaName,
          getschemawiseData: schemaResponse.data?.data || [],
        });
        console.log(allSchemasData,"allSchemasData")
      } catch (error) {
        console.error(`Error fetching data for schema ${schemaName}:`, error);
        // Continue with other schemas even if one fails
        allSchemasData.push({
          schema: schemaName,
          getschemawiseData: [],
        });
      }
    }

    // Return the first schema data for backward compatibility
    // but also include all schemas data
    const firstSchema = allSchemasData[0];
    return {
      ...firstSchema,
      allSchemas: allSchemasData,
      totalSchemas: uniqueSchemas.length,
      schemaNames: uniqueSchemas
    };
  }

  // Return empty object if no schema found
  return {};
};
// export const getSchemas = async (
//   token?: string
// ): Promise<any> => {
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//   };

//   // Add token to headers if provided
//   if (token) {
//     headers['x-auth-token'] = token;
//   }

//   const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/arwaves/schemas/unique`, {
//     headers,
//     withCredentials: true,
//   });

//   const uniqueSchemas = response.data.uniqueSchemas[0];
//     if(uniqueSchemas){
//       const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/arwaves/schema/${uniqueSchemas}`, {
//         headers,
//         withCredentials: true,
//       });


// const data = {
//   schema: uniqueSchemas,
//   getschemawiseData:response.data?.data,
// }

//       if(response.data.data[0]){
//         const responseUserHistory = await axios.get(`${import.meta.env.VITE_BASE_URL}/arwaves/schema/${uniqueSchemas}/user/${response.data.data[0]?.data._id}/history`, {
//           headers,
//           withCredentials: true,
//         });
//         console.log(responseUserHistory.data,"response.data user history wise" )
//       }
//     }
//   return response.data;

// };

// /api/schemas?qury&pageSize=100&÷

export interface StudentHistoryResponse {
  success: boolean;
  schema: string;
  userId: string;
  history: Array<{
    txId: string;
    schema: string;
    data: any;
    timestamp: string | null;
  }>;
  message?: string;
}

export const getStudentHistory = async (
  schemaName: string,
  studentId: string,
  token?: string
): Promise<StudentHistoryResponse> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await axios.get(
    `${import.meta.env.VITE_BASE_URL}/arwaves/schema/${schemaName}/user/${studentId}/history`,
    {
      headers,
      withCredentials: true,
    }
  );
  

  return response.data;
};

export const getStudentUid = async (studentId: string, token?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-auth-token'] = token;
  }
  const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/auth/get/student/uid/${studentId}`, {
    headers,
    withCredentials: true,
  });

  return response.data;
};  

export const getDataFromShemaAndSchemaAndStudentId = async (schema: string, studentId: string, token?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['x-auth-token'] = token;
  }
  const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/auth/get/student/data/${schema}/${studentId}`, {
    headers,
    withCredentials: true,
  });

  return response.data;
};

