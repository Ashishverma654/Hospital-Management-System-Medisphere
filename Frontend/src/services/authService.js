// Mock API Service for Authentication
export const loginUser = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock validation
      if (!email || !password) {
        reject(new Error("Email and password are required."));
      }
      
      // Admin Login
      if (email === "admin@hospital.com") {
        resolve({
          user: { id: 1, name: "Admin User", email: "admin@hospital.com", role: "admin" },
          token: "mock-jwt-token-admin-123"
        });
      }
      // Doctor Login
      else if (email === "doctor@hospital.com") {
        resolve({
          user: { id: 2, name: "Dr. Smith", email: "doctor@hospital.com", role: "doctor" },
          token: "mock-jwt-token-doctor-123"
        });
      }
      // Patient Login
      else if (email === "patient@hospital.com") {
        resolve({
          user: { id: 3, name: "John Doe", email: "patient@hospital.com", role: "patient" },
          token: "mock-jwt-token-patient-123"
        });
      }
      // Receptionist Login
      else if (email === "reception@hospital.com") {
        resolve({
          user: { id: 4, name: "Jane Desk", email: "reception@hospital.com", role: "receptionist" },
          token: "mock-jwt-token-receptionist-123"
        });
      } else {
        // Generic patient fallback for testing other emails
        resolve({
          user: { id: 99, name: email.split('@')[0], email, role: "patient" },
          token: "mock-jwt-token-generic-123"
        });
      }
    }, 1000); // Simulate network delay
  });
};

export const registerUser = async (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: { 
          id: Math.floor(Math.random() * 1000), 
          name: userData.name, 
          email: userData.email, 
          role: userData.role 
        },
        token: `mock-jwt-token-${userData.role}-new`
      });
    }, 1000);
  });
};
