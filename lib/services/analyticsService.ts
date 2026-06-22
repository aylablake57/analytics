import axios from '@/lib/api';

interface Location {
  id: number;
  title: string;
  lat: number;
  lng: number;
  sector: string;
  risk_level: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface Stats {
  total_companies: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  top_sector: string;
  top_sector_count: number;
}

interface RiskData {
  name: string;
  value: number;
  fill: string;
}

interface QuickAccessStats {
  health_clinics: number;
  hospitals: number;
  industry: number;
  high_risk_sites: number;
  gov_clinics: number;
  pvt_clinics: number;
}

const analyticsService = {
  /**
   * Get dashboard statistics
   */
  getStats: async (
    sector: string = 'all',
    risk: string = 'all'
  ): Promise<Stats> => {
    try {
      const response = await axios.get('/analytics/stats', {
        params: { sector, risk },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },

  /**
   * Get GIS location data
   */
  getLocations: async (
    sector: string = 'all',
    risk: string = 'all'
  ): Promise<Location[]> => {
    try {
      const response = await axios.get('/analytics/locations', {
        params: { sector, risk },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Get locations error:', error);
      throw error;
    }
  },

  /**
   * Get risk distribution data
   */
  getRiskDistribution: async (sector: string = 'all'): Promise<RiskData[]> => {
    try {
      const response = await axios.get('/analytics/risk-distribution', {
        params: { sector },
      });
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Get risk distribution error:', error);
      throw error;
    }
  },

  /**
   * Get sector distribution data
   */
  getSectorDistribution: async (): Promise<any[]> => {
    try {
      const response = await axios.get('/analytics/sector-distribution');
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Get sector distribution error:', error);
      throw error;
    }
  },

  /**
   * Get quick access statistics
   */
  getQuickAccess: async (
    sector: string = 'all'
  ): Promise<QuickAccessStats> => {
    try {
      const response = await axios.get('/analytics/quick-access', {
        params: { sector },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Get quick access error:', error);
      throw error;
    }
  },
};

export default analyticsService;
