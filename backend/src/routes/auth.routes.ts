import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  if (!authService.validateCredentials(username, password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = authService.generateToken(username);

  res.json({
    token,
    username,
  });
});

router.get('/verify', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    valid: true,
    username: req.user?.username,
  });
});

export default router;
