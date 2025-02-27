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
  InputLabel,
  FormControl,
  OutlinedInput
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  created_at: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const { user } = useAuth();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      showSnackbar('Erro ao carregar serviços', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setPrice(service.price.toString());
      setDuration(service.duration.toString());
    } else {
      setEditingService(null);
      setName('');
      setPrice('');
      setDuration('60');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveService = async () => {
    if (!name) {
      showSnackbar('Nome é obrigatório', 'error');
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      showSnackbar('Preço inválido', 'error');
      return;
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      showSnackbar('Duração inválida', 'error');
      return;
    }

    try {
      const priceValue = Number(price);
      const durationValue = Number(duration);

      if (editingService) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('services')
          .update({ name, price: priceValue, duration: durationValue })
          .eq('id', editingService.id);
        
        if (error) throw error;
        showSnackbar('Serviço atualizado com sucesso', 'success');
      } else {
        // Criar novo serviço
        const { error } = await supabase
          .from('services')
          .insert([{ 
            name, 
            price: priceValue, 
            duration: durationValue,
            created_by: user?.id 
          }]);
        
        if (error) throw error;
        showSnackbar('Serviço criado com sucesso', 'success');
      }
      
      handleCloseDialog();
      fetchServices();
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      showSnackbar('Erro ao salvar serviço', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return hours === 1 ? `1 hora` : `${hours} horas`;
      } else {
        return hours === 1 
          ? `1 hora e ${remainingMinutes} min` 
          : `${hours} horas e ${remainingMinutes} min`;
      }
    }
  };

  return (
    <Box>
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
      
      <TableContainer component={Paper}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                        {formatCurrency(service.price)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeIcon fontSize="small" sx={{ mr: 1, color: 'info.main' }} />
                        {formatDuration(service.duration)}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        onClick={() => handleOpenDialog(service)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
      
      {/* Dialog para criar/editar serviço */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingService ? 'Editar Serviço' : 'Novo Serviço'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Serviço"
            type="text"
            fullWidth
            variant="outlined"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel htmlFor="price-input">Preço</InputLabel>
            <OutlinedInput
              id="price-input"
              value={price}
              onChange={(e) => {
                // Permitir apenas números e ponto/vírgula
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                // Substituir vírgula por ponto
                setPrice(value.replace(',', '.'));
              }}
              startAdornment={<InputAdornment position="start">R$</InputAdornment>}
              label="Preço"
              placeholder="0.00"
            />
          </FormControl>
          
          <TextField
            margin="dense"
            label="Duração (minutos)"
            type="number"
            fullWidth
            variant="outlined"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
            }}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveService} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para feedback */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}