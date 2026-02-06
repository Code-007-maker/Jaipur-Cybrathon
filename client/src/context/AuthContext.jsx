import { createContext, useReducer, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: null
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'USER_LOADED':
            return {
                ...state,
                isAuthenticated: true,
                loading: false,
                user: action.payload
            };
        case 'REGISTER_SUCCESS':
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                ...action.payload,
                isAuthenticated: true,
                loading: false
            };
        case 'REGISTER_FAIL':
        case 'AUTH_ERROR':
        case 'LOGIN_FAIL':
        case 'LOGOUT':
            return {
                ...state,
                token: null,
                isAuthenticated: false,
                loading: false,
                user: null
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const loadUser = async () => {
        if (localStorage.token) {
            try {
                const res = await api.get('/auth/user');
                dispatch({ type: 'USER_LOADED', payload: res.data });
            } catch (err) {
                dispatch({ type: 'AUTH_ERROR' });
            }
        } else {
            dispatch({ type: 'AUTH_ERROR' });
        }
    };

    const register = async (formData) => {
        try {
            const res = await api.post('/auth/register', formData);
            localStorage.setItem('token', res.data.token); // Set token HERE
            dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
            await loadUser();
        } catch (err) {
            localStorage.removeItem('token');
            dispatch({ type: 'REGISTER_FAIL' });
            throw err.response?.data || { msg: 'Registration failed' };
        }
    };

    const login = async (formData) => {
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.token); // Set token HERE
            dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
            await loadUser();
        } catch (err) {
            localStorage.removeItem('token');
            dispatch({ type: 'LOGIN_FAIL' });
            throw err.response?.data || { msg: 'Login failed' };
        }
    };

    const initDoctorLogin = async (formData) => {
        try {
            const res = await api.post('/auth/doctor-login-init', formData);
            return res.data;
        } catch (err) {
            throw err.response?.data || { msg: 'Failed to send OTP' };
        }
    };

    const verifyDoctorOTP = async (formData) => {
        try {
            const res = await api.post('/auth/doctor-login-verify', formData);
            localStorage.setItem('token', res.data.token);
            dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
            // For doctors, we don't necessarily call loadUser() because the user object returned by verify is enough
            // and contains doctor-specific fields (like expiresAt)
            return res.data;
        } catch (err) {
            localStorage.removeItem('token');
            dispatch({ type: 'LOGIN_FAIL' });
            throw err.response?.data || { msg: 'OTP verification failed' };
        }
    };

    const updateProfile = async (formData) => {
        try {
            const res = await api.put('/auth/profile', formData);
            dispatch({ type: 'USER_LOADED', payload: res.data });
            return res.data;
        } catch (err) {
            console.error('Update Profile Error:', err);
            throw err.response?.data || { msg: 'Update failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, register, login, logout, updateProfile, initDoctorLogin, verifyDoctorOTP }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
