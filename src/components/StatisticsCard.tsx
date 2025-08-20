import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle } from 'react-native';
import theme from '../styles/theme';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  subtitle,
  color = theme.colors.primary,
  icon,
  style,
}) => {
  return (
    <Container style={style} color={color}>
      <Header>
        {icon && <IconContainer>{icon}</IconContainer>}
        <Title>{title}</Title>
      </Header>
      <Value color={color}>{value}</Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Container>
  );
};

const Container = styled.View<{ color: string }>`
  background-color: ${theme.colors.white};
  border-radius: 12px;
  padding: 16px;
  margin: 8px;
  min-height: 120px;
  justify-content: space-between;
  border-left-width: 4px;
  border-left-color: ${(props) => props.color};
  shadow-color: ${theme.colors.text};
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 4px;
  elevation: 3;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const IconContainer = styled.View`
  margin-right: 8px;
`;

const Title = styled.Text`
  font-size: 14px;
  color: ${theme.colors.text};
  font-weight: 500;
  opacity: 0.8;
`;

const Value = styled.Text<{ color: string }>`
  font-size: 28px;
  font-weight: bold;
  color: ${(props) => props.color};
  margin-bottom: 4px;
`;

const Subtitle = styled.Text`
  font-size: 12px;
  color: ${theme.colors.text};
  opacity: 0.6;
`;

export default StatisticsCard;
2.2 - Criar serviço de estatísticas
Caminho: src/services/statistics.ts
Ação: Criar novo arquivo
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  specialty: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Statistics {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  specialties: { [key: string]: number };
  appointmentsByMonth: { [key: string]: number };
  statusPercentages: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
}

export const statisticsService = {
  async getGeneralStatistics(): Promise<Statistics> {
    try {
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const appointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      const registeredUsersData = await AsyncStorage.getItem('@MedicalApp:registeredUsers');
      const registeredUsers = registeredUsersData ? JSON.parse(registeredUsersData) : [];

      // Estatísticas básicas
      const totalAppointments = appointments.length;
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

      // Contagem de pacientes únicos
      const uniquePatients = new Set(appointments.map(a => a.patientId));
      const totalPatients = uniquePatients.size;

      // Contagem de médicos únicos
      const uniqueDoctors = new Set(appointments.map(a => a.doctorId));
      const totalDoctors = uniqueDoctors.size;

      // Especialidades mais acessadas
      const specialties: { [key: string]: number } = {};
      appointments.forEach(appointment => {
        if (specialties[appointment.specialty]) {
          specialties[appointment.specialty]++;
        } else {
          specialties[appointment.specialty] = 1;
        }
      });

      // Consultas por mês
      const appointmentsByMonth: { [key: string]: number } = {};
      appointments.forEach(appointment => {
        try {
          const [day, month, year] = appointment.date.split('/');
          const monthKey = `${month}/${year}`;
          if (appointmentsByMonth[monthKey]) {
            appointmentsByMonth[monthKey]++;
          } else {
            appointmentsByMonth[monthKey] = 1;
          }
        } catch (error) {
          console.warn('Data inválida encontrada:', appointment.date);
        }
      });

      // Percentuais de status
      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending: totalAppointments > 0 ? (pendingAppointments / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalPatients,
        totalDoctors,
        specialties,
        appointmentsByMonth,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  },

  async getDoctorStatistics(doctorId: string): Promise<Partial<Statistics>> {
    try {
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const allAppointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      const doctorAppointments = allAppointments.filter(a => a.doctorId === doctorId);

      const totalAppointments = doctorAppointments.length;
      const confirmedAppointments = doctorAppointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = doctorAppointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = doctorAppointments.filter(a => a.status === 'cancelled').length;

      const uniquePatients = new Set(doctorAppointments.map(a => a.patientId));
      const totalPatients = uniquePatients.size;

      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending: totalAppointments > 0 ? (pendingAppointments / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalPatients,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do médico:', error);
      throw error;
    }
  },

  async getPatientStatistics(patientId: string): Promise<Partial<Statistics>> {
    try {
      const appointmentsData = await AsyncStorage.getItem('@MedicalApp:appointments');
      const allAppointments: Appointment[] = appointmentsData ? JSON.parse(appointmentsData) : [];
      
      const patientAppointments = allAppointments.filter(a => a.patientId === patientId);

      const totalAppointments = patientAppointments.length;
      const confirmedAppointments = patientAppointments.filter(a => a.status === 'confirmed').length;
      const pendingAppointments = patientAppointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = patientAppointments.filter(a => a.status === 'cancelled').length;

      const specialties: { [key: string]: number } = {};
      patientAppointments.forEach(appointment => {
        if (specialties[appointment.specialty]) {
          specialties[appointment.specialty]++;
        } else {
          specialties[appointment.specialty] = 1;
        }
      });

      const uniqueDoctors = new Set(patientAppointments.map(a => a.doctorId));
      const totalDoctors = uniqueDoctors.size;

      const statusPercentages = {
        confirmed: totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0,
        pending: totalAppointments > 0 ? (pendingAppointments / totalAppointments) * 100 : 0,
        cancelled: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      };

      return {
        totalAppointments,
        confirmedAppointments,
        pendingAppointments,
        cancelledAppointments,
        totalDoctors,
        specialties,
        statusPercentages,
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas do paciente:', error);
      throw error;
    }
  },
};