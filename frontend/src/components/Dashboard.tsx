import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector } from '../store/hooks';
import { createOrganization, getOrganizationProjects, getSchemas } from '../utils/organizationApi';
import type { OrganizationData, OrganizationDataResponse, Schema as ApiSchema } from '../utils/organizationApi';
import OrganizationKeysModal from './OrganizationKeysModal';
import Sidebar from './Sidebar';

interface Schema {
  id: string;
  name: string;
  type: string;
  definition: string;
  createdAt: string;
  isValid: boolean;
}


const Dashboard: React.FC = () => {
  const { apiUser, token, loading } = useAppSelector((state) => state.auth);


  const [activeTab, setActiveTab] = useState('dashboard');
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userOrganization, setUserOrganization] = useState<OrganizationDataResponse['organization'] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Organization modal state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgResponseData, setOrgResponseData] = useState<any>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    organizationOwner: '',
    organizationName: '',
    aboutMe: '',
    teamSize: 1
  });

  // Update form when apiUser changes
  useEffect(() => {
    if (apiUser?._id) {
      setProjectForm(prev => ({ ...prev, organizationOwner: apiUser._id }));
    }
  }, [apiUser]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});



  // Function to fetch schemas
  const fetchSchemas = async () => {
    try {
      setIsLoading(true);
      const response = await getSchemas(token || undefined);
      
      if (response.success) {
        // Convert API schemas to local Schema interface
        const apiSchemas: Schema[] = response.uniqueSchemas.map((apiSchema: ApiSchema) => ({
          id: apiSchema.id,
          name: apiSchema.name,
          type: apiSchema.type,
          definition: apiSchema.definition,
          createdAt: apiSchema.createdAt,
          isValid: apiSchema.isValid
        }));
        
        setSchemas(apiSchemas);
        toast.success(`Loaded ${response.count} schemas`);
      } else {
        toast.error('Failed to fetch schemas');
      }
    } catch (error: any) {
      console.error('Error fetching schemas:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to fetch schemas';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch projects using user_id as organization ID
  const fetchUserProjects = async () => {
    if (!apiUser?._id) {
      toast.error('User ID not available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await getOrganizationProjects(apiUser._id, token || undefined);
            
      if (response.success && response.organization && Array.isArray(response.organization)) {
        // Set the first organization as the user organization
        if (response.organization.length > 0) {
          const orgData = response.organization[0];
          setUserOrganization(orgData);
        }
        
        // Display organization data directly
        toast.success(`Loaded organization data: ${response.organization.length} organization(s)`);
      } else {
        toast.error('Failed to fetch organization data');
      }

      // Also fetch schemas in the same function to avoid duplicate API calls
      try {
        const schemaResponse = await getSchemas(token || undefined);
        
        if (schemaResponse.success) {
          // Convert API schemas to local Schema interface
          const apiSchemas: Schema[] = schemaResponse.uniqueSchemas.map((apiSchema: ApiSchema) => ({
            id: apiSchema.id,
            name: apiSchema.name,
            type: apiSchema.type,
            definition: apiSchema.definition,
            createdAt: apiSchema.createdAt,
            isValid: apiSchema.isValid
          }));
          
          setSchemas(apiSchemas);
          toast.success(`Loaded ${schemaResponse.count} schemas`);
        } else {
          toast.error('Failed to fetch schemas');
        }
      } catch (schemaError: any) {
        console.error('Error fetching schemas:', schemaError);
        const errorMessage = schemaError?.response?.data?.message || 'Failed to fetch schemas';
        toast.error(errorMessage);
      }

    } catch (error: any) {
      console.error('Error fetching user projects:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to fetch user projects';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user is available
  useEffect(() => {
    // Only fetch data if auth is not loading and both user ID and token are available
   
      // fetchUserProjects will handle both organization data and projects in one call
      fetchUserProjects();
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const validateForm = (formData: any, type: 'organization' | 'schema') => {
    const errors: { [key: string]: string } = {};

    if (type === 'organization') {
      if (!formData.organizationOwner.trim()) errors.organizationOwner = 'Organization owner is required';
      if (!formData.organizationName.trim()) errors.organizationName = 'Organization name is required';
      if (!formData.aboutMe.trim()) errors.aboutMe = 'About section is required';
      if (formData.teamSize < 1) errors.teamSize = 'Team size must be at least 1';
    } else {
      if (!formData.name.trim()) errors.name = 'Schema name is required';
      if (!formData.type.trim()) errors.type = 'Schema type is required';
      if (!formData.definition.trim()) errors.definition = 'Schema definition is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(projectForm, 'organization')) return;

    setIsLoading(true);

    try {
      // Call organization creation API with token from Redux
      const response = await createOrganization(projectForm as OrganizationData, token || undefined);


      // Show success modal with keys
      setOrgResponseData(response);
      setShowOrgModal(true);


      // Reset form
      setProjectForm({
        organizationOwner: apiUser?._id || '',
        organizationName: '',
        aboutMe: '',
        teamSize: 1
      });
      setFormErrors({});

      toast.success('Organization created successfully! 🎉');
    } catch (error: any) {
      console.error('Organization creation error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create organization';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'add-project', label: 'Create Organization', icon: '🏢' },
    { id: 'show-schema', label: 'Show Schema', icon: '📋' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'add-project':
        return (
          <div className="p-4 md:p-6 animate-fadeIn">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Create New Organization</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 transform transition-all duration-300 hover:shadow-md">
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Owner
                  </label>
                  <input
                    type="text"
                    value={projectForm.organizationOwner}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, organizationOwner: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.organizationOwner ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Enter organization owner name"
                  />
                  {formErrors.organizationOwner && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.organizationOwner}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={projectForm.organizationName}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, organizationName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.organizationName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Enter organization name"
                  />
                  {formErrors.organizationName && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.organizationName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About Organization
                  </label>
                  <textarea
                    value={projectForm.aboutMe}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, aboutMe: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.aboutMe ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    rows={4}
                    placeholder="Describe your organization"
                  />
                  {formErrors.aboutMe && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.aboutMe}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={projectForm.teamSize}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 1 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.teamSize ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Enter team size"
                  />
                  {formErrors.teamSize && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.teamSize}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Organization'
                  )}
                </button>
              </form>
            </div>
          </div>
        );
      case 'show-schema':
        return (
          <div className="p-4 md:p-6 animate-fadeIn">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Schema Management</h2>
            
            {/* Schema Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-xl">📋</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total Schemas</p>
                    <p className="text-xl font-bold text-gray-900">{schemas.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-xl">✅</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Valid Schemas</p>
                    <p className="text-xl font-bold text-gray-900">{schemas.filter(s => s.isValid).length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-xl">❌</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Invalid Schemas</p>
                    <p className="text-xl font-bold text-gray-900">{schemas.filter(s => !s.isValid).length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schema Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Schemas</h3>
                    <p className="text-sm text-gray-600 mt-1">View and manage your schema definitions</p>
                  </div>
                  <button
                    onClick={fetchSchemas}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {schemas.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schema Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Definition
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schemas.map((schema) => (
                        <tr key={schema.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{schema.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {schema.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${schema.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {schema.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(schema.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <pre className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border overflow-hidden whitespace-nowrap">
                                {schema.definition.length > 100 
                                  ? `${schema.definition.substring(0, 100)}...` 
                                  : schema.definition
                                }
                              </pre>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(schema.definition);
                                  toast.success('Schema definition copied to clipboard!');
                                }}
                                className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => {
                                  // Create a modal or expandable view to show full definition
                                  const fullDefinition = schema.definition;
                                  navigator.clipboard.writeText(fullDefinition);
                                  toast.success('Full schema definition copied to clipboard!');
                                }}
                                className="text-green-600 hover:text-green-900 text-xs font-medium"
                              >
                                View Full
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-lg font-medium mb-2">No schemas found</p>
                    <p className="text-sm">Create your first schema to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 md:p-6 animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
              {apiUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900">
                        Welcome back, {apiUser.name}! 👋
                      </h3>
                    </div>

                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Schemas</p>
                    <p className="text-2xl font-bold text-gray-900">{schemas.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {userOrganization ? `${userOrganization.organizationName}` : 'Organization'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{userOrganization ? 'Active' : 'None'}</p>
                    {userOrganization && (
                      <p className="text-xs text-gray-500 mt-1">
                        Status: {userOrganization.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Team Size</p>
                    <p className="text-2xl font-bold text-gray-900">{userOrganization?.teamSize || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
                    {userOrganization && (
                      <p className="text-sm text-gray-600 mt-1">
                        {userOrganization.organizationName}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fetchUserProjects(); // This now handles both projects and schemas
                      }}
                      disabled={isLoading || !apiUser?._id}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-gray-600">Loading organization...</span>
                    </div>
                  ) : userOrganization ? (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-lg mr-3">🏢</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${userOrganization.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {userOrganization.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">{userOrganization.organizationName}</p>
                        <p className="text-xs text-gray-600">{userOrganization.aboutMe}</p>
                        <p className="text-xs text-gray-500">Team Size: {userOrganization.teamSize}</p>
                        <p className="text-xs text-gray-500">Created: {new Date(userOrganization.createdAt).toLocaleDateString()}</p>
                        
                        {/* API Keys Section */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">API Keys</p>
                          
                          {/* Client ID */}
                          <div className="mb-2">
                            <label className="text-xs text-gray-500 block mb-1">Client ID:</label>
                            <div className="flex items-center bg-gray-100 rounded p-2">
                              <code className="text-xs text-gray-800 flex-1 font-mono break-all">
                                {userOrganization.clientId}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(userOrganization.clientId);
                                  toast.success('Client ID copied to clipboard!');
                                }}
                                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          
                          {/* Secret Key */}
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Secret Key:</label>
                            <div className="flex items-center bg-gray-100 rounded p-2">
                              <code className="text-xs text-gray-800 flex-1 font-mono break-all">
                                {userOrganization.secretKey}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(userOrganization.secretKey);
                                  toast.success('Secret Key copied to clipboard!');
                                }}
                                className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No organization found</p>
                      <p className="text-xs mt-1">Organization for user ID: {apiUser?._id || 'Not available'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Schemas</h3>
                <div className="space-y-3">
                  {schemas.slice(0, 3).map((schema) => (
                    <div key={schema.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <span className="text-lg mr-3">📋</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{schema.name}</p>
                        <p className="text-xs text-gray-500">{schema.type} • {schema.createdAt}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${schema.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {schema.isValid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sidebarItems={sidebarItems}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:ml-0">
        {renderContent()}
      </div>

      {/* Organization Keys Modal */}
      <OrganizationKeysModal
        isOpen={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        organizationData={orgResponseData}
      />

    </div>
  );
};

export default Dashboard;

