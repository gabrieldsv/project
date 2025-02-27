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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      const { error } = await signIn(email, password);
      
      if (error) {
        setError('Email ou senha incorretos');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Falha ao fazer login. Tente novamente.');
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
          Dellas - Cabelo e Pele
        </Typography>
        
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                Não tem uma conta? Cadastre-se
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}