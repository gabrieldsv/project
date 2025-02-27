import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  PeopleOutlined as PeopleIcon, 
  SpaOutlined as SpaIcon, 
  EventOutlined as EventIcon,
  AttachMoneyOutlined as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Cores para o gráfico de pizza
const COLORS = ['#f8bbd0', '#bbdefb', '#c8e6c9', '#ffe0b2', '#e1bee7', '#b3e5fc'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    clientCount: 0,
    serviceCount: 0,
    appointmentCount: 0,
    revenue: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Buscar contagem de clientes
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });
        
        // Buscar contagem de serviços
        const { count: serviceCount } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true });
        
        // Buscar contagem de agendamentos
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });
        
        // Buscar próximos agendamentos
        const today = new Date();
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            id,
            start_time,
            clients (
              name
            ),
            appointment_services (
              services (
                name
              )
            )
          `)
          .gte('start_time', today.toISOString())
          .order('start_time', { ascending: true })
          .limit(5);
        
        // Calcular receita total (simplificado)
        const { data: appointmentServices } = await supabase
          .from('appointment_services')
          .select('price');
        
        const revenue = appointmentServices?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
        
        // Estatísticas de serviços mais populares
        const { data: serviceData } = await supabase
          .from('appointment_services')
          .select(`
            service_id,
            services (
              name
            )
          `);
        
        const serviceMap = new Map();
        serviceData?.forEach(item => {
          const serviceName = item.services?.name || 'Desconhecido';
          serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + 1);
        });
        
        const serviceStatsData = Array.from(serviceMap.entries()).map(([name, value]) => ({
          name,
          value
        })).sort((a, b) => (b.value as number) - (a.value as number)).slice(0, 5);
        
        // Dados mensais para o gráfico de barras
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const currentYear = today.getFullYear();
        
        // Simulando dados mensais (em um sistema real, isso viria do banco de dados)
        const monthlyDataSimulated = months.map((month, index) => ({
          name: month,
          Agendamentos: Math.floor(Math.random() * 50) + 10,
          Receita: Math.floor(Math.random() * 5000) + 1000
        }));
        
        setStats({
          clientCount: clientCount || 0,
          serviceCount: serviceCount || 0,
          appointmentCount: appointmentCount || 0,
          revenue
        });
        
        setUpcomingAppointments(appointments || []);
        setServiceStats(serviceStatsData);
        setMonthlyData(monthlyDataSimulated);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'medium' }}>
        Dashboard
      </Typography>
      
      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.clientCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <SpaIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.serviceCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Serviços
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.appointmentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agendamentos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  R$ {stats.revenue.toLocaleString('pt-BR')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receita Total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Gráficos e listas */}
      <Grid container spacing={3}>
        {/* Gráfico de barras - Agendamentos por mês */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Agendamentos por Mês
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Agendamentos" fill="#f8bbd0" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Gráfico de pizza - Serviços mais populares */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Serviços Mais Populares
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {serviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Próximos agendamentos */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Próximos Agendamentos
            </Typography>
            {upcomingAppointments.length > 0 ? (
              <List>
                {upcomingAppointments.map((appointment, index) => (
                  <Box key={appointment.id}>
                    <ListItem>
                      <ListItemText
                        primary={appointment.clients?.name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {format(new Date(appointment.start_time), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}
                            </Typography>
                            <Typography component="span" variant="body2" display="block">
                              Serviços: {appointment.appointment_services.map((as: any) => as.services.name).join(', ')}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < upcomingAppointments.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                Não há agendamentos próximos.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}