import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  InputLabel,
  FormControl,
  Theme // Importando Theme do MUI
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'; // Removendo o tipo DateTimePickerProps
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { TextFieldProps } from '@mui/material/TextField'; // Importando TextFieldProps

// Interfaces para os dados
interface Appointment {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string; // Adicionado para refletir a estrutura da tabela
  appointment_services: { service_id: string; price: number }[];
  created_by: string;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openClientDialog, setOpenClientDialog] = useState(false); // Novo estado para modal de cliente
  const [openServiceDialog, setOpenServiceDialog] = useState(false); // Novo estado para modal de serviço
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [clientId, setClientId] = useState('');
  const [appointmentServices, setAppointmentServices] = useState<string[]>([]);
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(new Date());
  const [newClientName, setNewClientName] = useState(''); // Estado para novo cliente
  const [newClientPhone, setNewClientPhone] = useState(''); // Estado para telefone do novo cliente
  const [newServiceName, setNewServiceName] = useState(''); // Estado para novo serviço
  const [newServicePrice, setNewServicePrice] = useState(''); // Estado para preço do novo serviço
  const [newServiceDuration, setNewServiceDuration] = useState('60'); // Estado para duração do novo serviço
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
          .select('*, appointment_services(service_id, price, services(name, price))')
          .order('start_time', { ascending: true }),
        supabase.from('clients').select('*'),
        supabase.from('services').select('*')
      ]);

      if (appointmentsData.error) throw appointmentsData.error;
      if (clientsData.error) throw clientsData.error;
      if (servicesData.error) throw servicesData.error;

      setAppointments(appointmentsData.data || []);
      setFilteredAppointments(appointmentsData.data || []);
      setClients(clientsData.data || []);
      setServices(servicesData.data || []);
    } catch (error) {
      setError('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let filtered = [...appointments];
    if (searchTerm) {
      filtered = filtered.filter(appointment => {
        const client = clients.find(c => c.id === appointment.client_id);
        const serviceNames = appointment.appointment_services
          .map(as => services.find(s => s.id === as.service_id)?.name || '')
          .join(', ');

        return (
          client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client?.phone && client.phone.includes(searchTerm)) ||
          serviceNames.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, appointments]);

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setCurrentAppointment(appointment);
      setClientId(appointment.client_id);
      setAppointmentServices(appointment.appointment_services.map(as => as.service_id));
      setAppointmentDate(new Date(appointment.start_time));
    } else {
      setCurrentAppointment(null);
      setClientId('');
      setAppointmentServices([]);
      setAppointmentDate(new Date());
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewClientName('');
    setNewClientPhone('');
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDuration('60');
  };

  const handleCloseClientDialog = () => {
    setOpenClientDialog(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  const handleCloseServiceDialog = () => {
    setOpenServiceDialog(false);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDuration('60');
  };

  const handleSaveAppointment = async () => {
    if (!clientId || appointmentServices.length === 0 || !appointmentDate) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    try {
      let appointmentId: string;

      // Calcular end_time com base na duração total dos serviços
      const totalDurationMinutes = appointmentServices.reduce((total, serviceId) => {
        const service = services.find(s => s.id === serviceId);
        return total + (service?.duration || 0);
      }, 0);

      const startDate = new Date(appointmentDate);
      const endDate = new Date(startDate.getTime() + totalDurationMinutes * 60000); // Converter minutos para milissegundos

      if (currentAppointment) {
        // Atualizar agendamento existente
        const { error, data } = await supabase
          .from('appointments')
          .update({ 
            client_id: clientId, 
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString() 
          })
          .eq('id', currentAppointment.id)
          .select('id') // Para obter o ID do agendamento atualizado
          .single();

        if (error) throw error;
        appointmentId = data.id;
      } else {
        // Criar novo agendamento
        const { error, data } = await supabase
          .from('appointments')
          .insert([{ 
            client_id: clientId, 
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            created_by: user?.id 
          }])
          .select('id') // Para obter o ID do novo agendamento
          .single();

        if (error) throw error;
        appointmentId = data.id;
      }

      // Remover serviços antigos associados ao agendamento (se necessário)
      await supabase
        .from('appointment_services')
        .delete()
        .eq('appointment_id', appointmentId);

      // Inserir novos serviços associados ao agendamento
      const servicesToInsert = appointmentServices.map(serviceId => ({
        appointment_id: appointmentId,
        service_id: serviceId,
        price: services.find(s => s.id === serviceId)?.price || 0 // Pegar o preço do serviço, se disponível
      }));

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert);

      if (servicesError) throw servicesError;

      handleCloseDialog();
      fetchData();
    } catch (error) {
      setError('Erro ao salvar agendamento');
      console.error(error);
    }
  };

  const handleSaveNewClient = async () => {
    if (!newClientName) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      const { error, data } = await supabase
        .from('clients')
        .insert([{ 
          name: newClientName, 
          phone: newClientPhone || null, 
          created_by: user?.id 
        }])
        .select('id, name, phone')
        .single();

      if (error) throw error;

      setClients([...clients, data]);
      setClientId(data.id); // Define o novo cliente como selecionado no modal de agendamento
      handleCloseClientDialog();
    } catch (error) {
      setError('Erro ao adicionar novo cliente');
      console.error(error);
    }
  };

  const handleSaveNewService = async () => {
    if (!newServiceName || !newServicePrice || !newServiceDuration) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (isNaN(Number(newServicePrice)) || Number(newServicePrice) < 0) {
      setError('Preço inválido');
      return;
    }

    if (isNaN(Number(newServiceDuration)) || Number(newServiceDuration) <= 0) {
      setError('Duração inválida');
      return;
    }

    try {
      const { error, data } = await supabase
        .from('services')
        .insert([{ 
          name: newServiceName, 
          price: Number(newServicePrice), 
          duration: Number(newServiceDuration), 
          created_by: user?.id 
        }])
        .select('id, name, price, duration')
        .single();

      if (error) throw error;

      setServices([...services, data]);
      setAppointmentServices([...appointmentServices, data.id]); // Adiciona o novo serviço ao agendamento atual
      handleCloseServiceDialog();
    } catch (error) {
      setError('Erro ao adicionar novo serviço');
      console.error(error);
    }
  };

  const handleAddNewClient = () => {
    setOpenClientDialog(true);
  };

  const handleAddNewService = () => {
    setOpenServiceDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
          Agendamentos
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}
        >
          Novo Agendamento
        </Button>
      </Box>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome, telefone ou serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: '#fff',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-focused': {
                boxShadow: '0px 0px 0px 2px rgba(0, 0, 0, 0.1)', // Sombra mais sutil para consistência com a imagem
              },
            },
            '& .MuiInputBase-input': {
              padding: '10px 14px',
              color: 'text.secondary',
            },
          }}
        />
      </Paper>
      
      {/* Tabela de agendamentos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Serviços</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.map((appointment) => {
              const client = clients.find(c => c.id === appointment.client_id) || { name: 'Desconhecido', phone: '' };
              return (
                <TableRow key={appointment.id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>
                    {client.phone || 'Não informado'}
                  </TableCell>
                  <TableCell>
                    {appointment.appointment_services.map(as => 
                      services.find(service => service.id === as.service_id)?.name
                    ).join(', ')}
                  </TableCell>
                  <TableCell>{new Date(appointment.start_time).toLocaleString('pt-BR')}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpenDialog(appointment)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Modal de agendamento */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="client-label">Cliente</InputLabel>
            <Select
              labelId="client-label"
              value={clientId}
              onChange={(e) => setClientId(e.target.value as string)}
              label="Cliente"
              sx={(theme: Theme) => ({
                borderRadius: 16, // Bordas mais arredondadas como na imagem
                '& .MuiOutlinedInput-root': {
                  border: `2px solid ${theme.palette.primary.main}`, // Cor rosa pastel
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                  },
                  '&.Mui-focused': {
                    borderColor: theme.palette.primary.dark,
                  },
                },
              })}
            >
              {clients.map(client => (
                <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="services-label">Serviços</InputLabel>
            <Select
              labelId="services-label"
              multiple
              value={appointmentServices}
              onChange={(e) => setAppointmentServices(e.target.value as string[])}
              renderValue={(selected) => 
                selected.map(id => services.find(service => service.id === id)?.name).join(', ')
              }
              label="Serviços"
              sx={{ borderRadius: 16 }} // Bordas mais arredondadas
            >
              {services.map(service => (
                <MenuItem key={service.id} value={service.id}>
                  <Checkbox checked={appointmentServices.includes(service.id)} />
                  <ListItemText primary={service.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
            <DateTimePicker
              label="Data e Hora"
              value={appointmentDate}
              onChange={(newValue) => setAppointmentDate(newValue)}
              renderInput={(params: TextFieldProps) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  sx={{ 
                    mt: 2, 
                    borderRadius: 16, // Bordas mais arredondadas
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 16,
                    },
                  }} 
                />
              )}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={handleAddNewClient} 
              variant="contained" 
              sx={{ 
                backgroundColor: '#c8e6c9', // Verde pastel (suave, diferente de rosa)
                '&:hover': { backgroundColor: '#a5d6a7' },
                borderRadius: 16,
              }}
            >
              Adicionar Novo Cliente
            </Button>
            <Button 
              onClick={handleAddNewService} 
              variant="contained" 
              sx={{ 
                backgroundColor: '#b3e5fc', // Azul pastel (suave, diferente de rosa e verde)
                '&:hover': { backgroundColor: '#90caf9' },
                borderRadius: 16,
              }}
            >
              Adicionar Novo Serviço
            </Button>
            <Button 
              onClick={handleSaveAppointment} 
              variant="contained" 
              sx={{ 
                backgroundColor: 'primary.main', 
                '&:hover': { backgroundColor: 'primary.dark' },
                borderRadius: 16,
              }}
            >
              Salvar
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      
      {/* Modal para adicionar novo cliente */}
      <Dialog open={openClientDialog} onClose={handleCloseClientDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            type="text"
            fullWidth
            variant="outlined"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            required
            sx={{ mb: 2, borderRadius: 16 }}
          />
          <TextField
            margin="dense"
            label="Telefone"
            type="tel"
            fullWidth
            variant="outlined"
            value={newClientPhone}
            onChange={(e) => setNewClientPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            sx={{ borderRadius: 16 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseClientDialog} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveNewClient} 
            variant="contained" 
            sx={{ 
              backgroundColor: 'primary.main', 
              '&:hover': { backgroundColor: 'primary.dark' },
              borderRadius: 16,
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para adicionar novo serviço */}
      <Dialog open={openServiceDialog} onClose={handleCloseServiceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Novo Serviço</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Serviço"
            type="text"
            fullWidth
            variant="outlined"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            required
            sx={{ mb: 2, borderRadius: 16 }}
          />
          <TextField
            margin="dense"
            label="Preço"
            type="number"
            fullWidth
            variant="outlined"
            value={newServicePrice}
            onChange={(e) => setNewServicePrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
            sx={{ mb: 2, borderRadius: 16 }}
          />
          <TextField
            margin="dense"
            label="Duração (minutos)"
            type="number"
            fullWidth
            variant="outlined"
            value={newServiceDuration}
            onChange={(e) => setNewServiceDuration(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
            }}
            sx={{ borderRadius: 16 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseServiceDialog} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveNewService} 
            variant="contained" 
            sx={{ 
              backgroundColor: 'primary.main', 
              '&:hover': { backgroundColor: 'primary.dark' },
              borderRadius: 16,
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notificação de erro */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}