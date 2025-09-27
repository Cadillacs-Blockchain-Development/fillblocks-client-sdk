import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/authSlice';
import { createOrganization } from '../utils/organizationApi';
import type { OrganizationData } from '../utils/organizationApi';
import OrganizationKeysModal from './OrganizationKeysModal';

interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

interface Schema {
  id: string;
  name: string;
  type: string;
  definition: string;
  createdAt: string;
  isValid: boolean;
}

interface Organization {
  _id: string;
  organizationName: string;
  organizationOwner: string;
  aboutMe: string;
  teamSize: number;
  clientId: string;
  secretKey: string;
  wallet: string;
  walletPrivateKey: string;
  status: string;
  schemas: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { apiUser, token } = useAppSelector((state) => state.auth);

  // Debug logging
  console.log('Dashboard - Redux state:', { apiUser, token });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [schemaForm, setSchemaForm] = useState({
    name: '',
    type: '',
    definition: ''
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load sample data
  useEffect(() => {
    setProjects([
      {
        id: '1',
        name: 'E-commerce App',
        description: 'Modern e-commerce platform with React and Node.js',
        techStack: 'React, Node.js, MongoDB',
        createdAt: '2024-01-15',
        status: 'active'
      },
      {
        id: '2',
        name: 'Blog Platform',
        description: 'Content management system for bloggers',
        techStack: 'Next.js, PostgreSQL',
        createdAt: '2024-01-10',
        status: 'completed'
      }
    ]);

    setSchemas([
      {
        id: '1',
        name: 'User Profile',
        type: 'json',
        definition: '{"type": "object", "properties": {"name": {"type": "string"}, "email": {"type": "string"}}}',
        createdAt: '2024-01-12',
        isValid: true
      }
    ]);
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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);


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

      console.log('Organization created:', response);

      // Show success modal with keys
      setOrgResponseData(response);
      setShowOrgModal(true);

      // Add organization to the list
      setOrganizations(prev => [response.organization, ...prev]);

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

  const handleSchemaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(schemaForm, 'schema')) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newSchema: Schema = {
      id: Date.now().toString(),
      name: schemaForm.name,
      type: schemaForm.type,
      definition: schemaForm.definition,
      createdAt: new Date().toISOString().split('T')[0],
      isValid: true
    };

    setSchemas(prev => [newSchema, ...prev]);
    setSchemaForm({ name: '', type: '', definition: '' });
    setFormErrors({});
    setIsLoading(false);
    toast.success('Schema created successfully! 📋');
  };

  const handleSchemaValidate = () => {
    if (!schemaForm.definition.trim()) {
      toast.error('Please enter a schema definition first');
      return;
    }

    try {
      JSON.parse(schemaForm.definition);
      toast.success('Schema is valid! ✅');
    } catch (error) {
      toast.error('Invalid JSON schema');
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Close sidebar on mobile after selecting a tab
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      setShowUserMenu(false);
      toast.success('Logged out successfully! 👋');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out. Please try again.');
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'add-project', label: 'Create Organization', icon: '🏢' },
    { id: 'add-schema', label: 'Add Schema', icon: '📋' },
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
      case 'add-schema':
        return (
          <div className="p-4 md:p-6 animate-fadeIn">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Add New Schema</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 transform transition-all duration-300 hover:shadow-md">
              <form onSubmit={handleSchemaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Name
                  </label>
                  <input
                    type="text"
                    value={schemaForm.name}
                    onChange={(e) => setSchemaForm(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Enter schema name"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Type
                  </label>
                  <select
                    value={schemaForm.type}
                    onChange={(e) => setSchemaForm(prev => ({ ...prev, type: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.type ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select schema type</option>
                    <option value="json">JSON Schema</option>
                    <option value="xml">XML Schema</option>
                    <option value="database">Database Schema</option>
                    <option value="api">API Schema</option>
                  </select>
                  {formErrors.type && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.type}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schema Definition
                  </label>
                  <textarea
                    value={schemaForm.definition}
                    onChange={(e) => setSchemaForm(prev => ({ ...prev, definition: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm transition-colors duration-200 ${formErrors.definition ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    rows={8}
                    placeholder="Enter your schema definition here..."
                  />
                  {formErrors.definition && (
                    <p className="text-red-500 text-sm mt-1 animate-slideDown">{formErrors.definition}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
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
                      'Create Schema'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSchemaValidate}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    Validate
                  </button>
                </div>
              </form>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
                  </div>
                </div>
              </div>
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
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-all duration-300 hover:shadow-md hover:scale-105">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Organizations</h3>
                <div className="space-y-3">
                  {organizations.slice(0, 3).map((org) => (
                    <div key={org._id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <span className="text-lg mr-3">🏢</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{org.organizationName}</p>
                        <p className="text-xs text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {org.status}
                      </span>
                    </div>
                  ))}
                  {organizations.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No organizations created yet</p>
                      <p className="text-xs mt-1">Create your first organization to get started</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <span className="text-lg mr-3">📁</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.createdAt}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {project.status}
                      </span>
                    </div>
                  ))}
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

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={handleSidebarToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        w-64 bg-white shadow-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto
        fixed top-0 left-0 h-screen z-50
        md:h-full
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">FillBlocks</h1>
              <button
                onClick={handleSidebarToggle}
                className="md:hidden p-1 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Menu */}
            <div className="mt-4 relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {apiUser?.name?.charAt(0).toUpperCase() || apiUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3 text-left flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {apiUser?.name || apiUser?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {apiUser?.status === 'active' ? 'Online' : 'Offline'}
                  </p>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          <nav className="flex-1 px-6 pb-6">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-all duration-200 transform hover:scale-105 ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <span className="text-lg mr-3 transition-transform duration-200">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

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
