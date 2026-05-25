// User Authentication
import { buildApiUrl } from "./apiConfig";

const safeJsonParse = (value) => {
  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const userSignup = async (name, email, password, contactNumber, address) => {
  try {
    const response = await fetch(buildApiUrl('/user/auth/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        contactNumber,
        address,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const userLogin = async (email, password) => {
  try {
    const response = await fetch(buildApiUrl('/user/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/user/auth/profile'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/user/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/user/auth/password'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUserAccount = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(buildApiUrl('/user/auth/account'), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      logout();
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Admin Authentication
export const adminRegister = async (username, email, password) => {
  try {
    const response = await fetch(buildApiUrl('/admin/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const adminLogin = async (email, password) => {
  try {
    const response = await fetch(buildApiUrl('/admin/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('admin', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getAdminProfile = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(buildApiUrl('/admin/auth/profile'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateAdminProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(buildApiUrl('/admin/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('admin', JSON.stringify(data.user));
      return { success: true, data };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const changeAdminPassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(buildApiUrl('/admin/auth/password'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const businessSignup = async (username, email, password) => {
  try {
    const response = await fetch(buildApiUrl('/business/auth/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('businessToken', data.token);
      localStorage.setItem('business', JSON.stringify(data.user));
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const businessLogin = async (email, password) => {
  try {
    const response = await fetch(buildApiUrl('/business/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('businessToken', data.token);
      localStorage.setItem('business', JSON.stringify(data.user));
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getBusinessProfile = async () => {
  try {
    const token = localStorage.getItem('businessToken');
    const response = await fetch(buildApiUrl('/business/auth/profile'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateBusinessProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('businessToken');
    const response = await fetch(buildApiUrl('/business/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('business', JSON.stringify(data.user));
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const changeBusinessPassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('businessToken');
    const response = await fetch(buildApiUrl('/business/auth/password'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }

    return { success: false, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
  localStorage.removeItem('businessToken');
  localStorage.removeItem('business');
};

// Check auth status
export const isUserLoggedIn = () => {
  return !!localStorage.getItem('token');
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem('adminToken');
};

export const isBusinessLoggedIn = () => {
  return !!localStorage.getItem('businessToken');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return safeJsonParse(user);
};

export const getCurrentAdmin = () => {
  const admin = localStorage.getItem('admin');
  return safeJsonParse(admin);
};

export const getCurrentBusiness = () => {
  const business = localStorage.getItem('business');
  return safeJsonParse(business);
};
