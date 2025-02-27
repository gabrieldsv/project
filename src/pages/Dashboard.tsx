import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, CircularProgress } from '@mui/material';
import { People, Spa, CalendarToday } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Tipagem para os dados
interface Appointment {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  appointment_services: { service_id: string }[];
  created_by: string;
}

interface Client {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

export default function Dashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsData, clientsData, servicesData] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, appointment_services(service_id, services(name))')
          .eq('created_by', user?.id),
        supabase.from('clients').select('*').eq('created_by', user?.id),
        supabase.from('services').select('*').eq('created_by', user?.id),
      ]);

      if (appointmentsData.error) throw appointmentsData.error;
      if (clientsData.error) throw clientsData.error;
      if (servicesData.error) throw servicesData.error;

      setAppointments(appointmentsData.data || []);
      setClients(clientsData.data || []);
      setServices(servicesData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular os dados reais para os gráficos
  const currentYear = new Date().getFullYear();

  // Dados para o gráfico de agendamentos por mês
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthAppointments = appointments.filter(appointment => {
      const date = new Date(appointment.start_time);
      return date.getFullYear() === currentYear && date.getMonth() + 1 === month;
    });
    return {
      month: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }),
      Agendamentos: monthAppointments.length,
    };
  });

  // Dados para o gráfico de serviços mais populares
  const serviceCounts: { [key: string]: number } = {};
  appointments.forEach(appointment => {
    appointment.appointment_services.forEach(as => {
      const serviceName = services.find(s => s.id === as.service_id)?.name || 'Desconhecido';
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });
  });

  const popularServices = Object.entries(serviceCounts).map(([name, count]) => ({
    name,
    value: count,
  }));

  // Dados para os próximos agendamentos
  const upcomingAppointments = appointments
    .filter(appointment => new Date(appointment.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // Cores para o gráfico de pizza
  const COLORS = ['#f8bbd0', '#81d4fa', '#c8e6c9'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 4 }}>
        Dashboard
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <People sx={{ color: 'primary.main', fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{clients.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Clientes
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Spa sx={{ color: '#90caf9', fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{services.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Serviços
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarToday sx={{ color: '#81d4fa', fontSize: 40 }} />
            <Box>
              <Typography variant="h6">{appointments.length}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Agendamentos
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agendamentos por Mês
            </Typography>
            <Box sx={{ height: 240 }}>
              <BarChart
                width={600}
                height={240}
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Agendamentos" fill="#f8bbd0" />
              </BarChart>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Serviços Mais Populares
            </Typography>
            <Box sx={{ height: 240, display: 'flex', justifyContent: 'center' }}>
              <PieChart width={300} height={240}>
                <Pie
                  data={popularServices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {popularServices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Próximos agendamentos */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Próximos Agendamentos
        </Typography>
        {upcomingAppointments.length === 0 ? (
          <Typography color="text.secondary">
            Nenhum agendamento futuro encontrado.
          </Typography>
        ) : (
          upcomingAppointments.map(appointment => {
            const client = clients.find(c => c.id === appointment.client_id);
            const serviceNames = appointment.appointment_services
              .map(as => services.find(s => s.id === as.service_id)?.name)
              .join(', ');
            return (
              <Box key={appointment.id} sx={{ mb: 1 }}>
                <Typography>
                  {client?.name} - {new Date(appointment.start_time).toLocaleString('pt-BR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serviço: {serviceNames}
                </Typography>
              </Box>
            );
          })
        )}
      </Paper>
    </Box>
  );
}