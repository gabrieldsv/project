import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Avatar, 
  Button, 
  TextField, 
  Link, 
  Grid, 
  Box, 
  Typography, 
  Container, 
  Paper,
  Alert
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const { error } = await signUp(email, password, name);
      
      if (error) {
        if (error.message.includes('email')) {
          setError('Este email já está em uso');
        } else {
          setError(error.message);
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError('Falha ao criar conta. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ 
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Criar Conta
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome Completo"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirmar Senha"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                Já tem uma conta? Faça login
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}