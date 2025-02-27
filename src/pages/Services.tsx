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
  Alert 
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Interface para serviços
interface Service {
  id: string;
  name: string;
  duration: number;
  created_by: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('60');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('created_by', user?.id);

      if (error) throw error;

      setServices(data || []);
      setFilteredServices(data || []);
    } catch (error) {
      setError('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, services]);

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setCurrentService(service);
      setServiceName(service.name);
      setServiceDuration(service.duration.toString());
    } else {
      setCurrentService(null);
      setServiceName('');
      setServiceDuration('60');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveService = async () => {
    if (!serviceName || !serviceDuration) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (isNaN(Number(serviceDuration)) || Number(serviceDuration) <= 0) {
      setError('Duração inválida');
      return;
    }

    try {
      if (currentService) {
        const { error } = await supabase
          .from('services')
          .update({ 
            name: serviceName, 
            duration: Number(serviceDuration),
          })
          .eq('id', currentService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([{ 
            name: serviceName, 
            duration: Number(serviceDuration), 
            created_by: user?.id 
          }]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      setError('Erro ao salvar serviço');
      console.error(error);
    }
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
          Serviços
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Serviço
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nome do serviço..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Tabela de serviços */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.duration} minutos</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(service)}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de serviço */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Serviço"
            type="text"
            fullWidth
            variant="outlined"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            required
            sx={{ mb: 2, borderRadius: 16 }}
          />
          <TextField
            margin="dense"
            label="Duração (minutos)"
            type="number"
            fullWidth
            variant="outlined"
            value={serviceDuration}
            onChange={(e) => setServiceDuration(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
            }}
            sx={{ borderRadius: 16 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveService} 
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