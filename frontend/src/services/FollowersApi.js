import axios from 'axios';

// Ispravna putanja do followers endpointa preko API Gateway-a
const API_URL = 'http://localhost:8000/followers/api/Followers';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Dobavi listu ID-jeva korisnika koje ja pratim
export const getMyFollowing = () => apiClient.get('/me/following');

export const getMyFollowers = () => apiClient.get('/me/followers'); 

// Dobavi listu ID-jeva korisnika koje prati određeni korisnik
export const getUserFollowing = (userId) => apiClient.get(`/${userId}/following`);

// Dobavi listu ID-jeva korisnika koji prate određenog korisnika
export const getUserFollowers = (userId) => apiClient.get(`/${userId}/followers`);

// Dobavi preporuke za praćenje
export const getRecommendations = () => apiClient.get('/recommendations');

// Zaprati korisnika
export const followUser = (userId) => apiClient.post('/follow', { followedId: userId });

// Otprati korisnika
export const unfollowUser = (userId) => apiClient.delete(`/unfollow/${userId}`);