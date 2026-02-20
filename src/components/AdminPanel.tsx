import { useState, useEffect } from 'react';
import '../styles/admin.css';

// Login validado contra la base de datos (usuario/contraseña en colección admin)

const TEAM_COLORS = [
  '#ff6b35', '#4ade80', '#38bdf8', '#f472b6', '#fbbf24',
  '#a78bfa', '#fb923c', '#2dd4bf', '#f87171', '#60a5fa',
  '#34d399', '#c084fc', '#fcd34d', '#22d3ee', '#fb7185'
];

interface Team {
  position: number;
  name: string;
  color?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface GroupMatch {
  id: string;
  team1: string;
  team2: string;
  team1Score: number | null;
  team2Score: number | null;
  completed: boolean;
  date: string;
}

interface Group {
  id: string;
  name: string;
  teams: string[];
  matches: GroupMatch[];
  standings?: Array<{
    team: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    position: number;
  }>;
  qualified?: string[]; // Equipos que pasan a la siguiente fase
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'tournament' | 'league' | 'upcoming' | 'teams'>('tournament');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newResult, setNewResult] = useState({ team1: '', team2: '', goals1: '', goals2: '' });
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [tournamentType, setTournamentType] = useState<'groups' | 'direct'>('groups');
  const [knockoutRoundTab, setKnockoutRoundTab] = useState<'roundOf16' | 'quarterFinals' | 'semiFinals' | 'final'>('roundOf16');

  // Permite 0 como marcador (parseInt(x)||null convierte 0 en null)
  const parseScoreInput = (value: string): number | null => {
    const v = value.trim();
    if (v === '') return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  };

  // Equipos ya usados en otros partidos de la misma ronda (para no repetir en el desplegable)
  const getTeamsUsedInOtherMatches = (roundMatches: any[] | undefined, currentIndex: number): Set<string> => {
    if (!roundMatches || !Array.isArray(roundMatches)) return new Set();
    const used = new Set<string>();
    roundMatches.forEach((m: any, i: number) => {
      if (i === currentIndex) return;
      if (m.team1?.name && m.team1.name !== 'Por Definir') used.add(m.team1.name);
      if (m.team2?.name && m.team2.name !== 'Por Definir') used.add(m.team2.name);
    });
    return used;
  };

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      setMessage('Cargando datos...');
      const response = await fetch('/api/data.json');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const json = await response.json();
      
      // Si hay un error en la respuesta, mostrarlo
      if (json.error) {
        throw new Error(json.details || json.error);
      }
      
      // Asegurar que la estructura de datos existe
      if (!json.bracket) {
        json.bracket = {
          koPlayoffs: [],
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: { id: 'final', team1: { name: '', score: null }, team2: { name: '', score: null }, completed: false, date: '' }
        };
      }
      if (!json.league) {
        json.league = { teams: [] };
      }
      if (!json.upcomingMatches) {
        json.upcomingMatches = [];
      }
      if (!json.tournament) {
        json.tournament = {
          type: 'groups', // 'groups' o 'direct'
          groups: [],
          knockoutRounds: {
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            final: null
          }
        };
      }
      
      // Establecer el tipo de torneo desde los datos cargados
      if (json.tournament.type) {
        setTournamentType(json.tournament.type);
      } else {
        // Si no hay tipo definido, determinar según si hay grupos
        setTournamentType(json.tournament.groups && json.tournament.groups.length > 0 ? 'groups' : 'direct');
      }
      
      setData(json);
      setMessage('');
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage(`⚠️ Error al cargar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_auth', 'true');
        loadData();
        setUsername('');
        setPassword('');
      } else {
        setMessage(data.error || 'Usuario o contraseña incorrectos');
      }
    } catch {
      setMessage('Error de conexión. Revisa la consola.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_auth');
    setData(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('Guardando...');
    
    try {
      console.log('💾 Iniciando proceso de guardado...');
      console.log('📋 Estado de data:', {
        dataExists: !!data,
        hasBracket: !!data?.bracket,
        hasLeague: !!data?.league,
        hasUpcomingMatches: !!data?.upcomingMatches,
        dataKeys: data ? Object.keys(data) : []
      });
      
      // Validar que los datos tengan la estructura correcta antes de enviar
      if (!data) {
        console.error('❌ ERROR: data es null o undefined');
        setMessage('⚠️ Error: No hay datos para guardar. Por favor, recarga la página.');
        setLoading(false);
        return;
      }
      
      if (!data.bracket || !data.league || !data.upcomingMatches) {
        console.error('❌ ERROR: Estructura de datos incompleta');
        console.error('📋 Campos faltantes:', {
          bracket: !data.bracket,
          league: !data.league,
          upcomingMatches: !data.upcomingMatches
        });
        setMessage('⚠️ Error: Estructura de datos inválida. Por favor, recarga la página.');
        setLoading(false);
        return;
      }

      console.log('🔧 Limpiando y preparando datos para enviar...');
      
      // Limpiar y preparar los datos para enviar (eliminar referencias circulares y valores no serializables)
      const dataToSend: any = {
        bracket: {
          koPlayoffs: Array.isArray(data.bracket.koPlayoffs) ? data.bracket.koPlayoffs : [],
          roundOf16: Array.isArray(data.bracket.roundOf16) ? data.bracket.roundOf16 : [],
          quarterFinals: Array.isArray(data.bracket.quarterFinals) ? data.bracket.quarterFinals : [],
          semiFinals: Array.isArray(data.bracket.semiFinals) ? data.bracket.semiFinals : [],
          final: data.bracket.final || { id: 'final', team1: { name: '', score: null }, team2: { name: '', score: null }, completed: false, date: '' }
        },
        league: {
          teams: Array.isArray(data.league.teams) ? data.league.teams.map((team: Team) => ({
            position: Number(team.position) || 0,
            name: String(team.name || ''),
            color: String(team.color || TEAM_COLORS[0]),
            played: Number(team.played) || 0,
            wins: Number(team.wins) || 0,
            draws: Number(team.draws) || 0,
            losses: Number(team.losses) || 0,
            goalsFor: Number(team.goalsFor) || 0,
            goalsAgainst: Number(team.goalsAgainst) || 0,
            goalDifference: Number(team.goalDifference) || 0,
            points: Number(team.points) || 0
          })) : []
        },
        upcomingMatches: Array.isArray(data.upcomingMatches) ? data.upcomingMatches.map((match: any) => ({
          id: String(match.id || `up${Date.now()}`),
          team1: String(match.team1 || ''),
          team2: String(match.team2 || ''),
          date: String(match.date || ''),
          time: String(match.time || ''),
          type: String(match.type || 'Liga')
        })) : []
      };
      
      // Incluir tournament si existe
      if (data.tournament) {
        dataToSend.tournament = {
          type: data.tournament.type || tournamentType || 'groups',
          groups: Array.isArray(data.tournament.groups) ? data.tournament.groups.map((group: Group) => ({
            id: String(group.id || ''),
            name: String(group.name || ''),
            teams: Array.isArray(group.teams) ? group.teams.map((t: string) => String(t)) : [],
            matches: Array.isArray(group.matches) ? group.matches.map((match: GroupMatch) => ({
              id: String(match.id || ''),
              team1: String(match.team1 || ''),
              team2: String(match.team2 || ''),
              team1Score: match.team1Score !== null ? Number(match.team1Score) : null,
              team2Score: match.team2Score !== null ? Number(match.team2Score) : null,
              completed: Boolean(match.completed),
              date: String(match.date || '')
            })) : [],
            standings: Array.isArray(group.standings) ? group.standings.map((standing: any) => ({
              team: String(standing.team || ''),
              played: Number(standing.played) || 0,
              wins: Number(standing.wins) || 0,
              draws: Number(standing.draws) || 0,
              losses: Number(standing.losses) || 0,
              goalsFor: Number(standing.goalsFor) || 0,
              goalsAgainst: Number(standing.goalsAgainst) || 0,
              goalDifference: Number(standing.goalDifference) || 0,
              points: Number(standing.points) || 0,
              position: Number(standing.position) || 0
            })) : [],
            qualified: Array.isArray(group.qualified) ? group.qualified.map((t: string) => String(t)) : []
          })) : [],
          knockoutRounds: data.tournament.knockoutRounds ? {
            roundOf16: Array.isArray(data.tournament.knockoutRounds.roundOf16) ? data.tournament.knockoutRounds.roundOf16.map((match: any) => ({
              id: String(match.id || ''),
              team1: { name: String(match.team1?.name || ''), score: match.team1?.score !== null && match.team1?.score !== undefined ? Number(match.team1.score) : null },
              team2: { name: String(match.team2?.name || ''), score: match.team2?.score !== null && match.team2?.score !== undefined ? Number(match.team2.score) : null },
              completed: Boolean(match.completed),
              date: String(match.date || '')
            })) : [],
            quarterFinals: Array.isArray(data.tournament.knockoutRounds.quarterFinals) ? data.tournament.knockoutRounds.quarterFinals.map((match: any) => ({
              id: String(match.id || ''),
              team1: { name: String(match.team1?.name || ''), score: match.team1?.score !== null && match.team1?.score !== undefined ? Number(match.team1.score) : null },
              team2: { name: String(match.team2?.name || ''), score: match.team2?.score !== null && match.team2?.score !== undefined ? Number(match.team2.score) : null },
              completed: Boolean(match.completed),
              date: String(match.date || '')
            })) : [],
            semiFinals: Array.isArray(data.tournament.knockoutRounds.semiFinals) ? data.tournament.knockoutRounds.semiFinals.map((match: any) => ({
              id: String(match.id || ''),
              team1: { name: String(match.team1?.name || ''), score: match.team1?.score !== null && match.team1?.score !== undefined ? Number(match.team1.score) : null },
              team2: { name: String(match.team2?.name || ''), score: match.team2?.score !== null && match.team2?.score !== undefined ? Number(match.team2.score) : null },
              completed: Boolean(match.completed),
              date: String(match.date || '')
            })) : [],
            final: data.tournament.knockoutRounds.final ? {
              id: String(data.tournament.knockoutRounds.final.id || 'final'),
              team1: { name: String(data.tournament.knockoutRounds.final.team1?.name || ''), score: data.tournament.knockoutRounds.final.team1?.score !== null && data.tournament.knockoutRounds.final.team1?.score !== undefined ? Number(data.tournament.knockoutRounds.final.team1.score) : null },
              team2: { name: String(data.tournament.knockoutRounds.final.team2?.name || ''), score: data.tournament.knockoutRounds.final.team2?.score !== null && data.tournament.knockoutRounds.final.team2?.score !== undefined ? Number(data.tournament.knockoutRounds.final.team2.score) : null },
              completed: Boolean(data.tournament.knockoutRounds.final.completed),
              date: String(data.tournament.knockoutRounds.final.date || '')
            } : null
          } : {
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            final: null
          }
        };
      }
      
      console.log('✅ Datos preparados:', {
        bracketKeys: Object.keys(dataToSend.bracket),
        leagueTeams: dataToSend.league.teams.length,
        upcomingMatches: dataToSend.upcomingMatches.length,
        tournamentGroups: dataToSend.tournament?.groups?.length || 0,
        tournamentKnockoutRounds: !!dataToSend.tournament?.knockoutRounds
      });

      // Validar que el JSON se puede serializar
      let jsonString;
      try {
        console.log('📦 Preparando datos para enviar...');
        console.log('📊 Estructura de datos:', {
          bracket: {
            koPlayoffs: dataToSend.bracket.koPlayoffs?.length || 0,
            roundOf16: dataToSend.bracket.roundOf16?.length || 0,
            quarterFinals: dataToSend.bracket.quarterFinals?.length || 0,
            semiFinals: dataToSend.bracket.semiFinals?.length || 0,
            final: !!dataToSend.bracket.final
          },
          league: {
            teams: dataToSend.league.teams?.length || 0
          },
          upcomingMatches: dataToSend.upcomingMatches?.length || 0
        });
        
        jsonString = JSON.stringify(dataToSend);
        console.log('✅ JSON serializado correctamente');
        console.log('📏 Tamaño del JSON:', jsonString.length, 'caracteres');
        
        if (!jsonString || jsonString.length === 0) {
          throw new Error('El JSON serializado está vacío');
        }
        
        console.log('📄 Primeros 500 caracteres del JSON:', jsonString.substring(0, 500));
        console.log('📄 Últimos 200 caracteres del JSON:', jsonString.substring(Math.max(0, jsonString.length - 200)));
      } catch (jsonError) {
        console.error('❌ Error al serializar JSON:', jsonError);
        console.error('🔍 Datos que causaron el error:', dataToSend);
        setMessage('⚠️ Error: No se pudo preparar los datos para guardar. Verifica que todos los campos sean válidos.');
        setLoading(false);
        return;
      }

      console.log('🚀 Enviando datos al servidor...');
      console.log('🌐 URL:', '/api/save-data');
      console.log('📤 Método: POST');
      console.log('📦 Body a enviar (verificación):', jsonString ? `Tamaño: ${jsonString.length} caracteres` : 'VACÍO');
      
      if (!jsonString || jsonString.length === 0) {
        console.error('❌ ERROR: El JSON está vacío, no se puede enviar');
        setMessage('⚠️ Error: Los datos están vacíos. Por favor, añade al menos un equipo.');
        setLoading(false);
        return;
      }
      
      // Crear un nuevo objeto Request para asegurar que el body se envíe correctamente
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: jsonString,
        credentials: 'same-origin'
      };
      
      console.log('📤 Opciones de la petición:', {
        method: requestOptions.method,
        headers: requestOptions.headers,
        bodyLength: requestOptions.body ? String(requestOptions.body).length : 0,
        hasBody: !!requestOptions.body
      });
      
      const response = await fetch('/api/save-data', requestOptions);
      
      console.log('📥 Respuesta recibida');
      console.log('📊 Status:', response.status, response.statusText);
      console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

      let result;
      let text: string | null = null;
      try {
        text = await response.text();
        console.log('📄 Texto de respuesta recibido:', text.substring(0, 500));
        
        if (!text) {
          console.error('❌ Respuesta vacía del servidor');
          throw new Error('Respuesta vacía del servidor');
        }
        
        console.log('🔄 Intentando parsear JSON de la respuesta...');
        result = JSON.parse(text);
        console.log('✅ JSON parseado correctamente:', result);
      } catch (parseError) {
        console.error('❌ Error al parsear respuesta:', parseError);
        if (text) {
          console.error('📄 Texto que causó el error:', text.substring(0, 500));
        }
        setMessage(`⚠️ Error: No se pudo procesar la respuesta del servidor. Status: ${response.status}`);
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        console.log('✅ Guardado exitoso!');
        setMessage('✅ Datos guardados correctamente en MongoDB. Recarga la página principal para ver los cambios.');
      } else {
        const errorMsg = result.details || result.error || 'Error desconocido';
        console.error('❌ Error del servidor:', errorMsg);
        console.error('📋 Respuesta completa:', result);
        setMessage(`⚠️ Error: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error saving:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`⚠️ Error al guardar: ${errorMsg}. Verifica que MongoDB esté configurado correctamente.`);
    }
    
    setLoading(false);
  };

  // Función para calcular estadísticas automáticamente desde un resultado
  const applyMatchResultToLeague = (team1Name: string, team1Score: number, team2Name: string, team2Score: number) => {
    if (!team1Name || !team2Name || team1Score === null || team2Score === null) return;

    const newData = { ...data };
    let team1 = newData.league.teams.find((t: Team) => t.name === team1Name);
    let team2 = newData.league.teams.find((t: Team) => t.name === team2Name);

    // Si no existen los equipos, crearlos
    if (!team1) {
      team1 = {
        position: 0,
        name: team1Name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
      newData.league.teams.push(team1);
    }

    if (!team2) {
      team2 = {
        position: 0,
        name: team2Name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
      newData.league.teams.push(team2);
    }

    // Actualizar estadísticas del equipo 1
    team1.played += 1;
    team1.goalsFor += team1Score;
    team1.goalsAgainst += team2Score;
    team1.goalDifference = team1.goalsFor - team1.goalsAgainst;

    // Actualizar estadísticas del equipo 2
    team2.played += 1;
    team2.goalsFor += team2Score;
    team2.goalsAgainst += team1Score;
    team2.goalDifference = team2.goalsFor - team2.goalsAgainst;

    // Determinar resultado
    if (team1Score > team2Score) {
      team1.wins += 1;
      team2.losses += 1;
      team1.points += 3;
    } else if (team2Score > team1Score) {
      team2.wins += 1;
      team1.losses += 1;
      team2.points += 3;
    } else {
      team1.draws += 1;
      team2.draws += 1;
      team1.points += 1;
      team2.points += 1;
    }

    // Recalcular posiciones
    newData.league.teams.sort((a: Team, b: Team) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
    newData.league.teams.forEach((team: Team, i: number) => {
      team.position = i + 1;
    });

    setData(newData);
    setMessage('✅ Estadísticas actualizadas automáticamente desde el resultado del partido');
  };

  const updateBracketMatch = (stage: string, index: number, field: string, value: any) => {
    const newData = { ...data };
    let match: any;

    if (stage === 'final') {
      match = newData.bracket.final;
    } else {
      match = newData.bracket[stage][index];
    }

    if (field === 'team1' || field === 'team2') {
      match[field] = { ...match[field], ...value };
    } else {
      match[field] = value;
    }

    // Si se completa un partido con resultados, aplicar a la liga automáticamente
    if (field === 'completed' && value === true && match.team1.score !== null && match.team2.score !== null) {
      applyMatchResultToLeague(match.team1.name, match.team1.score, match.team2.name, match.team2.score);
    }

    // Si se actualiza el score de un partido completado, recalcular
    if ((field === 'team1' || field === 'team2') && match.completed && match.team1.score !== null && match.team2.score !== null) {
      const team1Score = field === 'team1' && 'score' in value ? value.score : match.team1.score;
      const team2Score = field === 'team2' && 'score' in value ? value.score : match.team2.score;
      if (team1Score !== null && team2Score !== null) {
        applyMatchResultToLeague(match.team1.name, team1Score, match.team2.name, team2Score);
      }
    }

    setData(newData);
  };

  const updateLeagueTeam = (index: number, field: string, value: any) => {
    const newData = { ...data };
    const team = newData.league.teams[index];
    
    if (field === 'goalsFor') {
      team.goalsFor = parseInt(value) || 0;
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    } else if (field === 'goalsAgainst') {
      team.goalsAgainst = parseInt(value) || 0;
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    } else if (field === 'wins' || field === 'draws' || field === 'losses') {
      team[field] = parseInt(value) || 0;
      team.played = team.wins + team.draws + team.losses;
      team.points = (team.wins * 3) + (team.draws * 1);
    } else {
      team[field] = value;
    }
    
    // Recalcular posición
    newData.league.teams.sort((a: Team, b: Team) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
    newData.league.teams.forEach((team: Team, i: number) => {
      team.position = i + 1;
    });
    
    setData(newData);
  };

  const addTeam = () => {
    const usedColors = new Set(data.league.teams.map((t: Team) => t.color).filter(Boolean));
    const defaultColor = TEAM_COLORS.find(c => !usedColors.has(c)) || TEAM_COLORS[data.league.teams.length % TEAM_COLORS.length];
    setEditingTeam({
      position: 0,
      name: '',
      color: defaultColor,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
    setShowTeamModal(true);
  };

  const saveTeam = () => {
    if (!editingTeam || !editingTeam.name) {
      setMessage('⚠️ El nombre del equipo es obligatorio');
      return;
    }

    const newData = { ...data };
    const existingIndex = newData.league.teams.findIndex((t: Team) => t.name === editingTeam!.name);

    if (existingIndex >= 0) {
      // Actualizar equipo existente
      newData.league.teams[existingIndex] = { ...editingTeam };
    } else {
      // Añadir nuevo equipo
      newData.league.teams.push({ ...editingTeam });
    }

    // Recalcular posiciones
    newData.league.teams.sort((a: Team, b: Team) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
    newData.league.teams.forEach((team: Team, i: number) => {
      team.position = i + 1;
    });

    setData(newData);
    setShowTeamModal(false);
    setEditingTeam(null);
    setMessage('✅ Equipo guardado correctamente');
  };

  const editTeam = (team: Team) => {
    setEditingTeam({ ...team });
    setShowTeamModal(true);
  };

  const deleteTeam = (index: number) => {
    if (confirm('¿Estás seguro de eliminar este equipo?')) {
      const newData = { ...data };
      newData.league.teams.splice(index, 1);
      
      // Recalcular posiciones
      newData.league.teams.forEach((team: Team, i: number) => {
        team.position = i + 1;
      });
      
      setData(newData);
      setMessage('✅ Equipo eliminado');
    }
  };

  const updateUpcomingMatch = (index: number, field: string, value: string) => {
    const newData = { ...data };
    newData.upcomingMatches[index][field] = value;
    setData(newData);
  };

  const addUpcomingMatch = () => {
    const newData = { ...data };
    const firstTeam = data.league.teams.length > 0 ? data.league.teams[0].name : '';
    const secondTeam = data.league.teams.length > 1 ? data.league.teams[1].name : '';
    const newMatch = {
      id: `up${Date.now()}`,
      team1: firstTeam,
      team2: secondTeam,
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      time: '20:00',
      type: 'Liga'
    };
    newData.upcomingMatches.push(newMatch);
    setData(newData);
  };

  const removeUpcomingMatch = (index: number) => {
    const newData = { ...data };
    newData.upcomingMatches.splice(index, 1);
    setData(newData);
  };

  // ========== FUNCIONES PARA TORNEO CON GRUPOS ==========
  
  // Calcular clasificación de un grupo
  const calculateGroupStandings = (group: Group): Group['standings'] => {
    const standings: { [key: string]: any } = {};
    
    // Inicializar estadísticas de cada equipo
    group.teams.forEach(team => {
      standings[team] = {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
    });
    
    // Procesar partidos completados
    group.matches.forEach(match => {
      if (match.completed && match.team1Score !== null && match.team2Score !== null) {
        const team1 = standings[match.team1];
        const team2 = standings[match.team2];
        
        if (team1 && team2) {
          team1.played += 1;
          team2.played += 1;
          team1.goalsFor += match.team1Score;
          team1.goalsAgainst += match.team2Score;
          team2.goalsFor += match.team2Score;
          team2.goalsAgainst += match.team1Score;
          
          if (match.team1Score > match.team2Score) {
            team1.wins += 1;
            team2.losses += 1;
            team1.points += 3;
          } else if (match.team2Score > match.team1Score) {
            team2.wins += 1;
            team1.losses += 1;
            team2.points += 3;
          } else {
            team1.draws += 1;
            team2.draws += 1;
            team1.points += 1;
            team2.points += 1;
          }
        }
      }
    });
    
    // Calcular diferencia de goles
    Object.values(standings).forEach((team: any) => {
      team.goalDifference = team.goalsFor - team.goalsAgainst;
    });
    
    // Ordenar por puntos y diferencia de goles
    const sorted = Object.values(standings).sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
    
    // Añadir posición
    sorted.forEach((team: any, index) => {
      team.position = index + 1;
    });
    
    return sorted as Group['standings'];
  };

  // Avanzar ganadores a la siguiente fase
  const advanceWinnersToNextRound = (newData: any) => {
    if (!newData.tournament || !newData.tournament.groups) return;
    
    const groups = newData.tournament.groups;
    const qualified: string[] = [];
    
    // Calcular clasificación de cada grupo y obtener equipos que avanzan
    groups.forEach((group: Group) => {
      group.standings = calculateGroupStandings(group);
      
      // Determinar cuántos equipos avanzan según la fase
      const teamsToAdvance = group.qualified?.length || 2; // Por defecto 2 por grupo
      const sorted = [...(group.standings || [])].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
      });
      
      group.qualified = sorted.slice(0, teamsToAdvance).map(t => t.team);
      qualified.push(...group.qualified);
    });
    
    // Generar partidos de la siguiente fase automáticamente
    generateNextRoundMatches(newData, qualified);
  };

  // Generar partidos de la siguiente ronda
  const generateNextRoundMatches = (newData: any, qualifiedTeams: string[]) => {
    if (!newData.tournament) {
      newData.tournament = { groups: [], knockoutRounds: { roundOf16: [], quarterFinals: [], semiFinals: [], final: null } };
    }
    
    if (!newData.tournament.knockoutRounds) {
      newData.tournament.knockoutRounds = { roundOf16: [], quarterFinals: [], semiFinals: [], final: null };
    }
    
    const rounds = newData.tournament.knockoutRounds;
    
    // Si hay 16 equipos o más, generar octavos
    if (qualifiedTeams.length >= 16 && rounds.roundOf16.length === 0) {
      for (let i = 0; i < qualifiedTeams.length; i += 2) {
        rounds.roundOf16.push({
          id: `r16-${i / 2 + 1}`,
          team1: { name: qualifiedTeams[i] || 'Por Definir', score: null },
          team2: { name: qualifiedTeams[i + 1] || 'Por Definir', score: null },
          completed: false,
          date: ''
        });
      }
    }
    
    // Si hay 8 equipos o más, generar cuartos
    if (qualifiedTeams.length >= 8 && qualifiedTeams.length < 16 && rounds.quarterFinals.length === 0) {
      for (let i = 0; i < qualifiedTeams.length; i += 2) {
        rounds.quarterFinals.push({
          id: `qf-${i / 2 + 1}`,
          team1: { name: qualifiedTeams[i] || 'Por Definir', score: null },
          team2: { name: qualifiedTeams[i + 1] || 'Por Definir', score: null },
          completed: false,
          date: ''
        });
      }
    }
    
    // Si hay 4 equipos, generar semifinales
    if (qualifiedTeams.length === 4 && rounds.semiFinals.length === 0) {
      rounds.semiFinals = [
        {
          id: 'sf-1',
          team1: { name: qualifiedTeams[0] || 'Por Definir', score: null },
          team2: { name: qualifiedTeams[1] || 'Por Definir', score: null },
          completed: false,
          date: ''
        },
        {
          id: 'sf-2',
          team1: { name: qualifiedTeams[2] || 'Por Definir', score: null },
          team2: { name: qualifiedTeams[3] || 'Por Definir', score: null },
          completed: false,
          date: ''
        }
      ];
    }
    
    // Actualizar próximos partidos desde las rondas eliminatorias
    updateUpcomingMatchesFromTournament(newData);
  };

  // Actualizar próximos partidos desde el torneo
  const updateUpcomingMatchesFromTournament = (newData: any) => {
    if (!newData.tournament || !newData.tournament.knockoutRounds) return;
    
    const rounds = newData.tournament.knockoutRounds;
    const upcoming: any[] = [];
    
    // Añadir partidos de octavos no completados
    rounds.roundOf16?.forEach((match: any) => {
      if (!match.completed && match.team1.name !== 'Por Definir' && match.team2.name !== 'Por Definir') {
        upcoming.push({
          id: match.id,
          team1: match.team1.name,
          team2: match.team2.name,
          date: match.date || '',
          time: '20:00',
          type: 'Copa'
        });
      }
    });
    
    // Añadir partidos de cuartos no completados
    rounds.quarterFinals?.forEach((match: any) => {
      if (!match.completed && match.team1.name !== 'Por Definir' && match.team2.name !== 'Por Definir') {
        upcoming.push({
          id: match.id,
          team1: match.team1.name,
          team2: match.team2.name,
          date: match.date || '',
          time: '20:00',
          type: 'Copa'
        });
      }
    });
    
    // Añadir partidos de semifinales no completados
    rounds.semiFinals?.forEach((match: any) => {
      if (!match.completed && match.team1.name !== 'Por Definir' && match.team2.name !== 'Por Definir') {
        upcoming.push({
          id: match.id,
          team1: match.team1.name,
          team2: match.team2.name,
          date: match.date || '',
          time: '20:00',
          type: 'Copa'
        });
      }
    });
    
    // Añadir final si no está completada
    if (rounds.final && !rounds.final.completed && rounds.final.team1.name !== 'Por Definir' && rounds.final.team2.name !== 'Por Definir') {
      upcoming.push({
        id: 'final',
        team1: rounds.final.team1.name,
        team2: rounds.final.team2.name,
        date: rounds.final.date || '',
        time: '20:00',
        type: 'Copa'
      });
    }
    
    // Combinar con partidos manuales existentes (evitar duplicados)
    const existingIds = new Set(upcoming.map(m => m.id));
    newData.upcomingMatches.forEach((match: any) => {
      if (!existingIds.has(match.id) && match.type === 'Copa') {
        // Mantener partidos manuales que no sean del torneo
      } else if (!existingIds.has(match.id)) {
        upcoming.push(match);
      }
    });
    
    newData.upcomingMatches = upcoming;
  };

  // Actualizar partido de grupo
  const updateGroupMatch = (groupIndex: number, matchIndex: number, field: string, value: any) => {
    const newData = { ...data };
    if (!newData.tournament) {
      newData.tournament = { groups: [] };
    }
    if (!newData.tournament.groups) {
      newData.tournament.groups = [];
    }
    
    const group = newData.tournament.groups[groupIndex];
    const match = group.matches[matchIndex];
    
    match[field] = value;
    
    // Recalcular clasificación del grupo
    group.standings = calculateGroupStandings(group);
    
    // Si se completa un partido, avanzar ganadores
    if (field === 'completed' && value === true && match.team1Score !== null && match.team2Score !== null) {
      advanceWinnersToNextRound(newData);
    }
    
    setData(newData);
  };

  // Añadir grupo
  const addGroup = () => {
    const newData = { ...data };
    if (!newData.tournament) {
      newData.tournament = { groups: [] };
    }
    if (!newData.tournament.groups) {
      newData.tournament.groups = [];
    }
    
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const nextLetter = groupLetters[newData.tournament.groups.length] || String.fromCharCode(65 + newData.tournament.groups.length);
    
    const newGroup: Group = {
      id: `group-${nextLetter}`,
      name: `Grupo ${nextLetter}`,
      teams: [],
      matches: [],
      qualified: []
    };
    
    newData.tournament.groups.push(newGroup);
    setData(newData);
    setEditingGroup(newGroup);
    setShowGroupModal(true);
  };

  // Guardar grupo
  const saveGroup = () => {
    if (!editingGroup) return;
    
    const newData = { ...data };
    const groupIndex = newData.tournament.groups.findIndex((g: Group) => g.id === editingGroup.id);
    
    if (groupIndex >= 0) {
      newData.tournament.groups[groupIndex] = { ...editingGroup };
    }
    
    // Recalcular clasificación
    newData.tournament.groups[groupIndex].standings = calculateGroupStandings(newData.tournament.groups[groupIndex]);
    
    // Generar partidos del grupo si hay equipos
    if (editingGroup.teams.length >= 2 && newData.tournament.groups[groupIndex].matches.length === 0) {
      generateGroupMatches(newData.tournament.groups[groupIndex]);
    }
    
    advanceWinnersToNextRound(newData);
    setData(newData);
    setShowGroupModal(false);
    setEditingGroup(null);
    setMessage('✅ Grupo guardado correctamente');
  };

  // Generar partidos de un grupo (todos contra todos)
  const generateGroupMatches = (group: Group) => {
    group.matches = [];
    for (let i = 0; i < group.teams.length; i++) {
      for (let j = i + 1; j < group.teams.length; j++) {
        group.matches.push({
          id: `${group.id}-match-${i}-${j}`,
          team1: group.teams[i],
          team2: group.teams[j],
          team1Score: null,
          team2Score: null,
          completed: false,
          date: ''
        });
      }
    }
  };

  // Avanzar ganadores de partidos eliminatorios
  const advanceKnockoutWinners = (newData: any, round: string, matchIndex: number) => {
    if (!newData.tournament || !newData.tournament.knockoutRounds) return;
    
    const match = newData.tournament.knockoutRounds[round][matchIndex];
    if (!match || !match.completed) return;
    
    // Verificar que ambos equipos tienen scores válidos
    const team1Score = match.team1?.score;
    const team2Score = match.team2?.score;
    
    if (team1Score === null || team1Score === undefined || team2Score === null || team2Score === undefined) {
      return; // No hay resultados aún
    }
    
    // Determinar ganador: el que tiene más goles
    const winner = team1Score > team2Score ? match.team1.name : 
                   team2Score > team1Score ? match.team2.name : null;
    
    if (!winner) {
      // Empate - no avanza nadie automáticamente
      console.log(`Empate en ${round} partido ${matchIndex + 1}: ${team1Score}-${team2Score}`);
      return;
    }
    
    console.log(`🏆 Ganador de ${round} partido ${matchIndex + 1}: ${winner} (${team1Score}-${team2Score})`);
    
    // Determinar siguiente ronda y posición según el tipo de torneo
    if (round === 'roundOf16') {
      // Avanzar a cuartos de final
      if (!newData.tournament.knockoutRounds.quarterFinals) {
        newData.tournament.knockoutRounds.quarterFinals = [];
      }
      
      // Calcular índice del partido de cuartos (cada 2 partidos de octavos van a 1 de cuartos)
      const quarterIndex = Math.floor(matchIndex / 2);
      
      // Crear partido de cuartos si no existe
      if (!newData.tournament.knockoutRounds.quarterFinals[quarterIndex]) {
        newData.tournament.knockoutRounds.quarterFinals[quarterIndex] = {
          id: `qf-${quarterIndex + 1}`,
          team1: { name: 'Por Definir', score: null },
          team2: { name: 'Por Definir', score: null },
          completed: false,
          date: ''
        };
      }
      
      const quarterMatch = newData.tournament.knockoutRounds.quarterFinals[quarterIndex];
      // Si es el primer partido del par (0, 2, 4, 6), va al equipo 1; si es el segundo (1, 3, 5, 7), va al equipo 2
      if (matchIndex % 2 === 0) {
        quarterMatch.team1.name = winner;
        console.log(`✅ ${winner} avanzó a Cuartos de Final - Partido ${quarterIndex + 1} (Equipo 1)`);
      } else {
        quarterMatch.team2.name = winner;
        console.log(`✅ ${winner} avanzó a Cuartos de Final - Partido ${quarterIndex + 1} (Equipo 2)`);
      }
      
    } else if (round === 'quarterFinals') {
      // Avanzar a semifinales
      if (!newData.tournament.knockoutRounds.semiFinals) {
        newData.tournament.knockoutRounds.semiFinals = [];
      }
      
      // Calcular índice del partido de semifinales (cada 2 partidos de cuartos van a 1 de semifinales)
      const semiIndex = Math.floor(matchIndex / 2);
      
      // Crear partido de semifinales si no existe
      if (!newData.tournament.knockoutRounds.semiFinals[semiIndex]) {
        newData.tournament.knockoutRounds.semiFinals[semiIndex] = {
          id: `sf-${semiIndex + 1}`,
          team1: { name: 'Por Definir', score: null },
          team2: { name: 'Por Definir', score: null },
          completed: false,
          date: ''
        };
      }
      
      const semiMatch = newData.tournament.knockoutRounds.semiFinals[semiIndex];
      if (matchIndex % 2 === 0) {
        semiMatch.team1.name = winner;
        console.log(`✅ ${winner} avanzó a Semifinales - Partido ${semiIndex + 1} (Equipo 1)`);
      } else {
        semiMatch.team2.name = winner;
        console.log(`✅ ${winner} avanzó a Semifinales - Partido ${semiIndex + 1} (Equipo 2)`);
      }
      
    } else if (round === 'semiFinals') {
      // Avanzar a final
      if (!newData.tournament.knockoutRounds.final) {
        newData.tournament.knockoutRounds.final = {
          id: 'final',
          team1: { name: 'Por Definir', score: null },
          team2: { name: 'Por Definir', score: null },
          completed: false,
          date: ''
        };
      }
      
      const finalMatch = newData.tournament.knockoutRounds.final;
      if (matchIndex === 0) {
        finalMatch.team1.name = winner;
        console.log(`✅ ${winner} avanzó a la Final (Equipo 1)`);
      } else if (matchIndex === 1) {
        finalMatch.team2.name = winner;
        console.log(`✅ ${winner} avanzó a la Final (Equipo 2)`);
      }
    }
    
    // Actualizar próximos partidos
    updateUpcomingMatchesFromTournament(newData);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-box">
          <h1>🔐 Panel de Administración</h1>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Ingresar</button>
            {message && <div className="error-message">{message}</div>}
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-loading">
        <div>Cargando datos...</div>
        {message && <div style={{ marginTop: '20px', color: '#ff6b35' }}>{message}</div>}
        <button 
          onClick={loadData} 
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            background: '#ff6b35', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panel de Administración - RL ROJUDASA</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => window.location.href = '/'} 
            className="preview-btn"
            style={{ background: '#4ade80', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            🏠 Volver al Inicio
          </button>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'tournament' ? 'active' : ''} 
          onClick={() => setActiveTab('tournament')}
        >
          🏆 Torneo
        </button>
        <button 
          className={activeTab === 'league' ? 'active' : ''} 
          onClick={() => setActiveTab('league')}
        >
          🏆 Liga
        </button>
        <button 
          className={activeTab === 'teams' ? 'active' : ''} 
          onClick={() => setActiveTab('teams')}
        >
          👥 Equipos
        </button>
        <button 
          className={activeTab === 'upcoming' ? 'active' : ''} 
          onClick={() => setActiveTab('upcoming')}
        >
          📅 Próximos Partidos
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'tournament' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>🏆 Torneo</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => window.open('/', '_blank')} 
                  className="preview-btn"
                >
                  👁️ Ver Vista Previa
                </button>
              </div>
            </div>
            
            {/* Selector de tipo de torneo */}
            <div style={{ 
              background: '#1a1a2e', 
              padding: '20px', 
              borderRadius: '10px', 
              marginBottom: '20px',
              border: '2px solid #ff6b35'
            }}>
              <label style={{ display: 'block', color: '#ffd23f', marginBottom: '15px', fontSize: '1.1rem', fontWeight: '600' }}>
                Tipo de Torneo:
              </label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: tournamentType === 'groups' ? 'rgba(255, 107, 53, 0.3)' : 'transparent',
                  border: `2px solid ${tournamentType === 'groups' ? '#ff6b35' : '#666'}`
                }}>
                  <input
                    type="radio"
                    name="tournamentType"
                    value="groups"
                    checked={tournamentType === 'groups'}
                    onChange={(e) => {
                      const newType = e.target.value as 'groups' | 'direct';
                      setTournamentType(newType);
                      const newData = { ...data };
                      if (!newData.tournament) {
                        newData.tournament = { type: newType, groups: [], knockoutRounds: { roundOf16: [], quarterFinals: [], semiFinals: [], final: null } };
                      } else {
                        newData.tournament.type = newType;
                        // Si cambia a direct, limpiar grupos
                        if (newType === 'direct') {
                          newData.tournament.groups = [];
                        }
                      }
                      setData(newData);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff' }}>🏆 Con Grupos</span>
                </label>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: tournamentType === 'direct' ? 'rgba(255, 107, 53, 0.3)' : 'transparent',
                  border: `2px solid ${tournamentType === 'direct' ? '#ff6b35' : '#666'}`
                }}>
                  <input
                    type="radio"
                    name="tournamentType"
                    value="direct"
                    checked={tournamentType === 'direct'}
                    onChange={(e) => {
                      const newType = e.target.value as 'groups' | 'direct';
                      setTournamentType(newType);
                      const newData = { ...data };
                      if (!newData.tournament) {
                        newData.tournament = { type: newType, groups: [], knockoutRounds: { roundOf16: [], quarterFinals: [], semiFinals: [], final: null } };
                      } else {
                        newData.tournament.type = newType;
                        // Si cambia a direct, limpiar grupos
                        if (newType === 'direct') {
                          newData.tournament.groups = [];
                        }
                      }
                      setData(newData);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: '#fff' }}>⚔️ Eliminación Directa</span>
                </label>
              </div>
            </div>
            
            {/* Contenido según el tipo de torneo */}
            {tournamentType === 'groups' ? (
              <>
                <div className="admin-note" style={{ background: '#1e3a5f', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <strong>💡 Instrucciones - Torneo con Grupos:</strong> 
                  <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <li>Crea grupos y añade equipos a cada grupo</li>
                    <li>Los partidos se generan automáticamente (todos contra todos)</li>
                    <li>Ingresa los resultados de los partidos</li>
                    <li>La clasificación se calcula automáticamente</li>
                    <li>Los equipos que avanzan se determinan automáticamente</li>
                    <li>Los próximos partidos se generan automáticamente desde las fases eliminatorias</li>
                  </ol>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={addGroup} className="add-btn">
                    ➕ Añadir Grupo
                  </button>
                </div>
                
                {/* Grupos */}
                {(!data.tournament || !data.tournament.groups || data.tournament.groups.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#b0b0b0' }}>
                    <p>No hay grupos creados aún.</p>
                    <p>Haz clic en "➕ Añadir Grupo" para comenzar.</p>
                  </div>
                ) : (
              data.tournament.groups.map((group: Group, groupIndex: number) => (
                <div key={group.id} className="admin-subsection" style={{ 
                  background: '#1a1a2e', 
                  padding: '20px', 
                  borderRadius: '10px', 
                  marginBottom: '30px',
                  border: '2px solid #ff6b35'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ color: '#ffd23f', margin: 0 }}>{group.name}</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setEditingGroup({ ...group });
                          setShowGroupModal(true);
                        }}
                        className="add-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                      >
                        ✏️ Editar Grupo
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`¿Eliminar ${group.name}?`)) {
                            const newData = { ...data };
                            newData.tournament.groups.splice(groupIndex, 1);
                            setData(newData);
                          }
                        }}
                        className="remove-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                  
                  {/* Clasificación del Grupo */}
                  {group.standings && group.standings.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>Clasificación</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255, 107, 53, 0.2)' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Pos</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Equipo</th>
                            <th style={{ padding: '8px' }}>PJ</th>
                            <th style={{ padding: '8px' }}>V</th>
                            <th style={{ padding: '8px' }}>E</th>
                            <th style={{ padding: '8px' }}>D</th>
                            <th style={{ padding: '8px' }}>GF</th>
                            <th style={{ padding: '8px' }}>GC</th>
                            <th style={{ padding: '8px' }}>DG</th>
                            <th style={{ padding: '8px' }}>PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map((team: any, idx: number) => (
                            <tr 
                              key={team.team}
                              style={{ 
                                background: group.qualified?.includes(team.team) ? 'rgba(74, 222, 128, 0.2)' : 'transparent',
                                borderBottom: '1px solid rgba(255, 107, 53, 0.1)'
                              }}
                            >
                              <td style={{ padding: '8px', fontWeight: team.position <= (group.qualified?.length || 2) ? '700' : '400' }}>
                                {team.position}
                                {group.qualified?.includes(team.team) && ' ✅'}
                              </td>
                              <td style={{ padding: '8px', fontWeight: team.position <= (group.qualified?.length || 2) ? '700' : '400' }}>
                                {team.team}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.played}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.wins}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.draws}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.losses}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.goalsFor}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{team.goalsAgainst}</td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'center',
                                color: team.goalDifference >= 0 ? '#4ade80' : '#f87171',
                                fontWeight: '600'
                              }}>
                                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                              </td>
                              <td style={{ 
                                padding: '8px', 
                                textAlign: 'center',
                                color: '#ffd23f',
                                fontWeight: '700'
                              }}>
                                {team.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Partidos del Grupo */}
                  <div>
                    <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>Partidos</h4>
                    {group.matches.length === 0 ? (
                      <div style={{ color: '#b0b0b0', padding: '20px', textAlign: 'center' }}>
                        No hay partidos aún. Añade al menos 2 equipos al grupo para generar partidos automáticamente.
                      </div>
                    ) : (
                      group.matches.map((match: GroupMatch, matchIndex: number) => (
                        <div key={match.id} className="admin-match" style={{ 
                          marginBottom: '10px',
                          padding: '10px',
                          background: match.completed ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 107, 53, 0.05)',
                          borderRadius: '6px',
                          border: match.completed ? '1px solid #4ade80' : '1px solid rgba(255, 107, 53, 0.3)'
                        }}>
                          <select
                            value={match.team1}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.groups[groupIndex].matches[matchIndex].team1 = e.target.value;
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="">Selecciona Equipo 1</option>
                            {data.league.teams.map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={match.team1Score ?? ''}
                            onChange={(e) => updateGroupMatch(groupIndex, matchIndex, 'team1Score', parseScoreInput(e.target.value))}
                            placeholder="Goles"
                            style={{ width: '70px', textAlign: 'center' }}
                            min="0"
                          />
                          <span>VS</span>
                          <input
                            type="number"
                            value={match.team2Score ?? ''}
                            onChange={(e) => updateGroupMatch(groupIndex, matchIndex, 'team2Score', parseScoreInput(e.target.value))}
                            placeholder="Goles"
                            style={{ width: '70px', textAlign: 'center' }}
                            min="0"
                          />
                          <select
                            value={match.team2}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.groups[groupIndex].matches[matchIndex].team2 = e.target.value;
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="">Selecciona Equipo 2</option>
                            {data.league.teams.map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={match.date}
                            onChange={(e) => updateGroupMatch(groupIndex, matchIndex, 'date', e.target.value)}
                            placeholder="Fecha"
                            style={{ width: '100px' }}
                          />
                          <label>
                            <input
                              type="checkbox"
                              checked={match.completed}
                              onChange={(e) => updateGroupMatch(groupIndex, matchIndex, 'completed', e.target.checked)}
                            />
                            Completado
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
              </>
            ) : (
              <>
                <div className="admin-note" style={{ background: '#1e3a5f', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                  <strong>💡 Instrucciones - Eliminación Directa:</strong> 
                  <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
                    <li>Elige la fase que quieres configurar (Octavos, Cuartos, Semifinales o Final)</li>
                    <li>Selecciona los equipos para cada partido de esa fase</li>
                    <li>Ingresa los resultados; los ganadores avanzan automáticamente a la siguiente ronda</li>
                  </ol>
                </div>

                {/* Selector de fase: Octavos | Cuartos | Semifinales | Final */}
                <div style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '24px', 
                  flexWrap: 'wrap',
                  background: '#1a1a2e',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #ff6b35'
                }}>
                  {(['roundOf16', 'quarterFinals', 'semiFinals', 'final'] as const).map((round) => (
                    <button
                      key={round}
                      type="button"
                      onClick={() => setKnockoutRoundTab(round)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: `2px solid ${knockoutRoundTab === round ? '#ff6b35' : '#444'}`,
                        background: knockoutRoundTab === round ? 'rgba(255, 107, 53, 0.3)' : 'transparent',
                        color: '#fff',
                        fontWeight: knockoutRoundTab === round ? 700 : 400,
                        cursor: 'pointer',
                        fontSize: '0.95rem'
                      }}
                    >
                      {round === 'roundOf16' && '🥉 Octavos'}
                      {round === 'quarterFinals' && '🥈 Cuartos'}
                      {round === 'semiFinals' && '🥇 Semifinales'}
                      {round === 'final' && '🏆 Final'}
                    </button>
                  ))}
                </div>
                
                {/* Fases Eliminatorias - solo la ronda seleccionada */}
                <div style={{ marginTop: '20px' }}>
                  {knockoutRoundTab === 'roundOf16' && (
                  <div className="admin-subsection">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3>Octavos de Final</h3>
                      <button 
                        onClick={() => {
                          const newData = { ...data };
                          if (!newData.tournament) {
                            newData.tournament = { type: 'direct', groups: [], knockoutRounds: { roundOf16: [], quarterFinals: [], semiFinals: [], final: null } };
                          }
                          if (!newData.tournament.knockoutRounds) {
                            newData.tournament.knockoutRounds = { roundOf16: [], quarterFinals: [], semiFinals: [], final: null };
                          }
                          if (!newData.tournament.knockoutRounds.roundOf16) {
                            newData.tournament.knockoutRounds.roundOf16 = [];
                          }
                          newData.tournament.knockoutRounds.roundOf16.push({
                            id: `r16-${newData.tournament.knockoutRounds.roundOf16.length + 1}`,
                            team1: { name: 'Por Definir', score: null },
                            team2: { name: 'Por Definir', score: null },
                            completed: false,
                            date: ''
                          });
                          setData(newData);
                        }}
                        className="add-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                      >
                        ➕ Añadir Partido
                      </button>
                    </div>
                    {(!data.tournament?.knockoutRounds?.roundOf16 || data.tournament.knockoutRounds.roundOf16.length === 0) ? (
                      <p style={{ color: '#b0b0b0', textAlign: 'center', padding: '20px' }}>No hay partidos de octavos aún. Haz clic en "➕ Añadir Partido" para comenzar.</p>
                    ) : (
                      data.tournament.knockoutRounds.roundOf16.map((match: any, index: number) => {
                        const usedInOtherR16 = getTeamsUsedInOtherMatches(data.tournament?.knockoutRounds?.roundOf16, index);
                        return (
                        <div key={match.id} className="admin-match" style={{ marginBottom: '10px' }}>
                          <select
                            value={match.team1.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.roundOf16[index].team1.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team1.name || !usedInOtherR16.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={match.team1.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.roundOf16[index].team1.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.roundOf16[index].completed && 
                                  newScore !== null && 
                                  newData.tournament.knockoutRounds.roundOf16[index].team2.score !== null) {
                                advanceKnockoutWinners(newData, 'roundOf16', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <span>VS</span>
                          <input
                            type="number"
                            value={match.team2.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.roundOf16[index].team2.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.roundOf16[index].completed && 
                                  newData.tournament.knockoutRounds.roundOf16[index].team1.score !== null && 
                                  newScore !== null) {
                                advanceKnockoutWinners(newData, 'roundOf16', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <select
                            value={match.team2.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.roundOf16[index].team2.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team2.name || !usedInOtherR16.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={match.date}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.roundOf16[index].date = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            placeholder="Fecha"
                            style={{ width: '100px' }}
                          />
                          <label>
                            <input
                              type="checkbox"
                              checked={match.completed}
                              onChange={(e) => {
                                const newData = { ...data };
                                newData.tournament.knockoutRounds.roundOf16[index].completed = e.target.checked;
                                // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                                if (e.target.checked) {
                                  const team1Score = newData.tournament.knockoutRounds.roundOf16[index].team1.score;
                                  const team2Score = newData.tournament.knockoutRounds.roundOf16[index].team2.score;
                                  if (team1Score !== null && team2Score !== null) {
                                    advanceKnockoutWinners(newData, 'roundOf16', index);
                                    setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.roundOf16[index].team1.name : newData.tournament.knockoutRounds.roundOf16[index].team2.name} avanzó automáticamente a Cuartos de Final`);
                                  }
                                }
                                updateUpcomingMatchesFromTournament(newData);
                                setData(newData);
                              }}
                            />
                            Completado
                          </label>
                          <button
                            onClick={() => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.roundOf16.splice(index, 1);
                              setData(newData);
                            }}
                            className="remove-btn"
                            style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      ); })
                    )}
                  </div>
                  )}

                  {knockoutRoundTab === 'quarterFinals' && (
                  <div className="admin-subsection">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3>Cuartos de Final</h3>
                      <button 
                        onClick={() => {
                          const newData = { ...data };
                          if (!newData.tournament.knockoutRounds.quarterFinals) {
                            newData.tournament.knockoutRounds.quarterFinals = [];
                          }
                          newData.tournament.knockoutRounds.quarterFinals.push({
                            id: `qf-${newData.tournament.knockoutRounds.quarterFinals.length + 1}`,
                            team1: { name: 'Por Definir', score: null },
                            team2: { name: 'Por Definir', score: null },
                            completed: false,
                            date: ''
                          });
                          setData(newData);
                        }}
                        className="add-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                      >
                        ➕ Añadir Partido
                      </button>
                    </div>
                    {data.tournament.knockoutRounds.quarterFinals && data.tournament.knockoutRounds.quarterFinals.length > 0 && (
                      data.tournament.knockoutRounds.quarterFinals.map((match: any, index: number) => {
                        const usedInOtherQF = getTeamsUsedInOtherMatches(data.tournament?.knockoutRounds?.quarterFinals, index);
                        return (
                        <div key={match.id} className="admin-match" style={{ marginBottom: '10px' }}>
                          <select
                            value={match.team1.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.quarterFinals[index].team1.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team1.name || !usedInOtherQF.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={match.team1.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.quarterFinals[index].team1.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.quarterFinals[index].completed && 
                                  newScore !== null && 
                                  newData.tournament.knockoutRounds.quarterFinals[index].team2.score !== null) {
                                advanceKnockoutWinners(newData, 'quarterFinals', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <span>VS</span>
                          <input
                            type="number"
                            value={match.team2.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.quarterFinals[index].team2.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.quarterFinals[index].completed && 
                                  newData.tournament.knockoutRounds.quarterFinals[index].team1.score !== null && 
                                  newScore !== null) {
                                advanceKnockoutWinners(newData, 'quarterFinals', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <select
                            value={match.team2.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.quarterFinals[index].team2.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team2.name || !usedInOtherQF.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={match.date}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.quarterFinals[index].date = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            placeholder="Fecha"
                            style={{ width: '100px' }}
                          />
                          <label>
                            <input
                              type="checkbox"
                              checked={match.completed}
                              onChange={(e) => {
                                const newData = { ...data };
                                newData.tournament.knockoutRounds.quarterFinals[index].completed = e.target.checked;
                                // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                                if (e.target.checked) {
                                  const team1Score = newData.tournament.knockoutRounds.quarterFinals[index].team1.score;
                                  const team2Score = newData.tournament.knockoutRounds.quarterFinals[index].team2.score;
                                  if (team1Score !== null && team2Score !== null) {
                                    advanceKnockoutWinners(newData, 'quarterFinals', index);
                                    setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.quarterFinals[index].team1.name : newData.tournament.knockoutRounds.quarterFinals[index].team2.name} avanzó automáticamente a Semifinales`);
                                  }
                                }
                                updateUpcomingMatchesFromTournament(newData);
                                setData(newData);
                              }}
                            />
                            Completado
                          </label>
                          <button
                            onClick={() => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.quarterFinals.splice(index, 1);
                              setData(newData);
                            }}
                            className="remove-btn"
                            style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      ); })
                    )}
                  </div>
                  )}

                  {knockoutRoundTab === 'semiFinals' && (
                  <div className="admin-subsection">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3>Semifinales</h3>
                      <button 
                        onClick={() => {
                          const newData = { ...data };
                          if (!newData.tournament.knockoutRounds.semiFinals) {
                            newData.tournament.knockoutRounds.semiFinals = [];
                          }
                          newData.tournament.knockoutRounds.semiFinals.push({
                            id: `sf-${newData.tournament.knockoutRounds.semiFinals.length + 1}`,
                            team1: { name: 'Por Definir', score: null },
                            team2: { name: 'Por Definir', score: null },
                            completed: false,
                            date: ''
                          });
                          setData(newData);
                        }}
                        className="add-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                      >
                        ➕ Añadir Partido
                      </button>
                    </div>
                    {data.tournament.knockoutRounds.semiFinals && data.tournament.knockoutRounds.semiFinals.length > 0 && (
                      data.tournament.knockoutRounds.semiFinals.map((match: any, index: number) => {
                        const usedInOtherSF = getTeamsUsedInOtherMatches(data.tournament?.knockoutRounds?.semiFinals, index);
                        return (
                        <div key={match.id} className="admin-match" style={{ marginBottom: '10px' }}>
                          <select
                            value={match.team1.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.semiFinals[index].team1.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team1.name || !usedInOtherSF.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={match.team1.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.semiFinals[index].team1.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.semiFinals[index].completed && 
                                  newScore !== null && 
                                  newData.tournament.knockoutRounds.semiFinals[index].team2.score !== null) {
                                advanceKnockoutWinners(newData, 'semiFinals', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <span>VS</span>
                          <input
                            type="number"
                            value={match.team2.score ?? ''}
                            onChange={(e) => {
                              const newData = { ...data };
                              const newScore = parseScoreInput(e.target.value);
                              newData.tournament.knockoutRounds.semiFinals[index].team2.score = newScore;
                              // Si el partido está completado y ambos scores están presentes, avanzar ganador
                              if (newData.tournament.knockoutRounds.semiFinals[index].completed && 
                                  newData.tournament.knockoutRounds.semiFinals[index].team1.score !== null && 
                                  newScore !== null) {
                                advanceKnockoutWinners(newData, 'semiFinals', index);
                              }
                              setData(newData);
                            }}
                            placeholder="Goles"
                            style={{ width: '80px' }}
                          />
                          <select
                            value={match.team2.name}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.semiFinals[index].team2.name = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            style={{ flex: 1, minWidth: '120px' }}
                          >
                            <option value="Por Definir">Por Definir</option>
                            {data.league.teams.filter((team: Team) => team.name === match.team2.name || !usedInOtherSF.has(team.name)).map((team: Team) => (
                              <option key={team.name} value={team.name}>{team.name}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={match.date}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.semiFinals[index].date = e.target.value;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                            placeholder="Fecha"
                            style={{ width: '100px' }}
                          />
                          <label>
                            <input
                              type="checkbox"
                              checked={match.completed}
                              onChange={(e) => {
                                const newData = { ...data };
                                newData.tournament.knockoutRounds.semiFinals[index].completed = e.target.checked;
                                // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                                if (e.target.checked) {
                                  const team1Score = newData.tournament.knockoutRounds.semiFinals[index].team1.score;
                                  const team2Score = newData.tournament.knockoutRounds.semiFinals[index].team2.score;
                                  if (team1Score !== null && team2Score !== null) {
                                    advanceKnockoutWinners(newData, 'semiFinals', index);
                                    setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.semiFinals[index].team1.name : newData.tournament.knockoutRounds.semiFinals[index].team2.name} avanzó automáticamente a la Final`);
                                  }
                                }
                                updateUpcomingMatchesFromTournament(newData);
                                setData(newData);
                              }}
                            />
                            Completado
                          </label>
                          <button
                            onClick={() => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.semiFinals.splice(index, 1);
                              setData(newData);
                            }}
                            className="remove-btn"
                            style={{ fontSize: '0.85rem', padding: '8px 15px' }}
                          >
                            🗑️
                          </button>
                        </div>
                      ); })
                    )}
                  </div>
                  )}

                  {knockoutRoundTab === 'final' ? (
                  <div className="admin-subsection">
                    <h3>Final</h3>
                    {!data.tournament.knockoutRounds.final && (
                      <button 
                        onClick={() => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final = {
                            id: 'final',
                            team1: { name: 'Por Definir', score: null },
                            team2: { name: 'Por Definir', score: null },
                            completed: false,
                            date: ''
                          };
                          setData(newData);
                        }}
                        className="add-btn"
                        style={{ fontSize: '0.85rem', padding: '8px 15px', marginBottom: '10px' }}
                      >
                        ➕ Crear Final
                      </button>
                    )}
                    {data.tournament.knockoutRounds.final && (
                      <div className="admin-match">
                        <select
                          value={data.tournament.knockoutRounds.final.team1.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.team1.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          <option value="Por Definir">Por Definir</option>
                          {data.league.teams.map((team: Team) => (
                            <option key={team.name} value={team.name}>{team.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={data.tournament.knockoutRounds.final.team1.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.team1.score = parseScoreInput(e.target.value);
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <span>VS</span>
                        <input
                          type="number"
                          value={data.tournament.knockoutRounds.final.team2.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.team2.score = parseScoreInput(e.target.value);
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <select
                          value={data.tournament.knockoutRounds.final.team2.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.team2.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          <option value="Por Definir">Por Definir</option>
                          {data.league.teams.map((team: Team) => (
                            <option key={team.name} value={team.name}>{team.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={data.tournament.knockoutRounds.final.date}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.date = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Fecha"
                          style={{ width: '100px' }}
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={data.tournament.knockoutRounds.final.completed}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.final.completed = e.target.checked;
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                          />
                          Completado
                        </label>
                      </div>
                    )}
                  </div>
                  ) : null}
              </div>
              </>
            )}
            
            {/* Fases Eliminatorias - Solo para torneo con grupos */}
            {tournamentType === 'groups' && data.tournament?.knockoutRounds && (
              <div style={{ marginTop: '40px' }}>
                <h2 style={{ color: '#ff6b35', marginBottom: '20px' }}>Fases Eliminatorias</h2>
                
                {/* Octavos de Final */}
                {data.tournament.knockoutRounds.roundOf16 && data.tournament.knockoutRounds.roundOf16.length > 0 && (
                  <div className="admin-subsection">
                    <h3>Octavos de Final</h3>
                    {data.tournament.knockoutRounds.roundOf16.map((match: any, index: number) => (
                      <div key={match.id} className="admin-match">
                        <input
                          type="text"
                          value={match.team1.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.roundOf16[index].team1.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 1"
                        />
                        <input
                          type="number"
                          value={match.team1.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.roundOf16[index].team1.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.roundOf16[index].completed && 
                                newScore !== null && 
                                newData.tournament.knockoutRounds.roundOf16[index].team2.score !== null) {
                              advanceKnockoutWinners(newData, 'roundOf16', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <span>VS</span>
                        <input
                          type="number"
                          value={match.team2.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.roundOf16[index].team2.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.roundOf16[index].completed && 
                                newData.tournament.knockoutRounds.roundOf16[index].team1.score !== null && 
                                newScore !== null) {
                              advanceKnockoutWinners(newData, 'roundOf16', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <input
                          type="text"
                          value={match.team2.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.roundOf16[index].team2.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 2"
                        />
                        <input
                          type="text"
                          value={match.date}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.roundOf16[index].date = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Fecha"
                          style={{ width: '100px' }}
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={match.completed}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.roundOf16[index].completed = e.target.checked;
                              // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                              if (e.target.checked) {
                                const team1Score = newData.tournament.knockoutRounds.roundOf16[index].team1.score;
                                const team2Score = newData.tournament.knockoutRounds.roundOf16[index].team2.score;
                                if (team1Score !== null && team2Score !== null) {
                                  advanceKnockoutWinners(newData, 'roundOf16', index);
                                  setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.roundOf16[index].team1.name : newData.tournament.knockoutRounds.roundOf16[index].team2.name} avanzó automáticamente a Cuartos de Final`);
                                }
                              }
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                          />
                          Completado
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Cuartos de Final */}
                {data.tournament.knockoutRounds.quarterFinals && data.tournament.knockoutRounds.quarterFinals.length > 0 && (
                  <div className="admin-subsection">
                    <h3>Cuartos de Final</h3>
                    {data.tournament.knockoutRounds.quarterFinals.map((match: any, index: number) => (
                      <div key={match.id} className="admin-match">
                        <input
                          type="text"
                          value={match.team1.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.quarterFinals[index].team1.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 1"
                        />
                        <input
                          type="number"
                          value={match.team1.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.quarterFinals[index].team1.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.quarterFinals[index].completed && 
                                newScore !== null && 
                                newData.tournament.knockoutRounds.quarterFinals[index].team2.score !== null) {
                              advanceKnockoutWinners(newData, 'quarterFinals', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <span>VS</span>
                        <input
                          type="number"
                          value={match.team2.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.quarterFinals[index].team2.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.quarterFinals[index].completed && 
                                newData.tournament.knockoutRounds.quarterFinals[index].team1.score !== null && 
                                newScore !== null) {
                              advanceKnockoutWinners(newData, 'quarterFinals', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <input
                          type="text"
                          value={match.team2.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.quarterFinals[index].team2.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 2"
                        />
                        <input
                          type="text"
                          value={match.date}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.quarterFinals[index].date = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Fecha"
                          style={{ width: '100px' }}
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={match.completed}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.quarterFinals[index].completed = e.target.checked;
                              // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                              if (e.target.checked) {
                                const team1Score = newData.tournament.knockoutRounds.quarterFinals[index].team1.score;
                                const team2Score = newData.tournament.knockoutRounds.quarterFinals[index].team2.score;
                                if (team1Score !== null && team2Score !== null) {
                                  advanceKnockoutWinners(newData, 'quarterFinals', index);
                                  setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.quarterFinals[index].team1.name : newData.tournament.knockoutRounds.quarterFinals[index].team2.name} avanzó automáticamente a Semifinales`);
                                }
                              }
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                          />
                          Completado
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Semifinales */}
                {data.tournament.knockoutRounds.semiFinals && data.tournament.knockoutRounds.semiFinals.length > 0 && (
                  <div className="admin-subsection">
                    <h3>Semifinales</h3>
                    {data.tournament.knockoutRounds.semiFinals.map((match: any, index: number) => (
                      <div key={match.id} className="admin-match">
                        <input
                          type="text"
                          value={match.team1.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.semiFinals[index].team1.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 1"
                        />
                        <input
                          type="number"
                          value={match.team1.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.semiFinals[index].team1.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.semiFinals[index].completed && 
                                newScore !== null && 
                                newData.tournament.knockoutRounds.semiFinals[index].team2.score !== null) {
                              advanceKnockoutWinners(newData, 'semiFinals', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <span>VS</span>
                        <input
                          type="number"
                          value={match.team2.score ?? ''}
                          onChange={(e) => {
                            const newData = { ...data };
                            const newScore = parseScoreInput(e.target.value);
                            newData.tournament.knockoutRounds.semiFinals[index].team2.score = newScore;
                            // Si el partido está completado y ambos scores están presentes, avanzar ganador
                            if (newData.tournament.knockoutRounds.semiFinals[index].completed && 
                                newData.tournament.knockoutRounds.semiFinals[index].team1.score !== null && 
                                newScore !== null) {
                              advanceKnockoutWinners(newData, 'semiFinals', index);
                            }
                            setData(newData);
                          }}
                          placeholder="Goles"
                          style={{ width: '80px' }}
                        />
                        <input
                          type="text"
                          value={match.team2.name}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.semiFinals[index].team2.name = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Equipo 2"
                        />
                        <input
                          type="text"
                          value={match.date}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.semiFinals[index].date = e.target.value;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                          placeholder="Fecha"
                          style={{ width: '100px' }}
                        />
                        <label>
                          <input
                            type="checkbox"
                            checked={match.completed}
                            onChange={(e) => {
                              const newData = { ...data };
                              newData.tournament.knockoutRounds.semiFinals[index].completed = e.target.checked;
                              // Si se marca como completado y ambos scores están presentes, avanzar ganador automáticamente
                              if (e.target.checked) {
                                const team1Score = newData.tournament.knockoutRounds.semiFinals[index].team1.score;
                                const team2Score = newData.tournament.knockoutRounds.semiFinals[index].team2.score;
                                if (team1Score !== null && team2Score !== null) {
                                  advanceKnockoutWinners(newData, 'semiFinals', index);
                                  setMessage(`✅ ${team1Score > team2Score ? newData.tournament.knockoutRounds.semiFinals[index].team1.name : newData.tournament.knockoutRounds.semiFinals[index].team2.name} avanzó automáticamente a la Final`);
                                }
                              }
                              updateUpcomingMatchesFromTournament(newData);
                              setData(newData);
                            }}
                          />
                          Completado
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Final */}
                {data.tournament.knockoutRounds.final && (
                  <div className="admin-subsection">
                    <h3>Final</h3>
                    <div className="admin-match">
                      <input
                        type="text"
                        value={data.tournament.knockoutRounds.final.team1.name}
                        onChange={(e) => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final.team1.name = e.target.value;
                          updateUpcomingMatchesFromTournament(newData);
                          setData(newData);
                        }}
                        placeholder="Equipo 1"
                      />
                      <input
                        type="number"
                        value={data.tournament.knockoutRounds.final.team1.score ?? ''}
                        onChange={(e) => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final.team1.score = parseScoreInput(e.target.value);
                          updateUpcomingMatchesFromTournament(newData);
                          setData(newData);
                        }}
                        placeholder="Goles"
                        style={{ width: '80px' }}
                      />
                      <span>VS</span>
                      <input
                        type="number"
                        value={data.tournament.knockoutRounds.final.team2.score ?? ''}
                        onChange={(e) => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final.team2.score = parseScoreInput(e.target.value);
                          updateUpcomingMatchesFromTournament(newData);
                          setData(newData);
                        }}
                        placeholder="Goles"
                        style={{ width: '80px' }}
                      />
                      <input
                        type="text"
                        value={data.tournament.knockoutRounds.final.team2.name}
                        onChange={(e) => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final.team2.name = e.target.value;
                          updateUpcomingMatchesFromTournament(newData);
                          setData(newData);
                        }}
                        placeholder="Equipo 2"
                      />
                      <input
                        type="text"
                        value={data.tournament.knockoutRounds.final.date}
                        onChange={(e) => {
                          const newData = { ...data };
                          newData.tournament.knockoutRounds.final.date = e.target.value;
                          updateUpcomingMatchesFromTournament(newData);
                          setData(newData);
                        }}
                        placeholder="Fecha"
                        style={{ width: '100px' }}
                      />
                      <label>
                        <input
                          type="checkbox"
                          checked={data.tournament.knockoutRounds.final.completed}
                          onChange={(e) => {
                            const newData = { ...data };
                            newData.tournament.knockoutRounds.final.completed = e.target.checked;
                            updateUpcomingMatchesFromTournament(newData);
                            setData(newData);
                          }}
                        />
                        Completado
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'league' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>🏆 Tabla de Liga</h2>
              <button 
                onClick={() => {
                  if (confirm('¿Estás seguro de limpiar las estadísticas de la liga? Esto reseteará puntos, partidos jugados y goles, pero mantendrá los equipos.')) {
                    const newData = { ...data };
                    // Solo resetear estadísticas, mantener equipos con sus nombres y colores
                    newData.league.teams = newData.league.teams.map((team: Team) => ({
                      ...team,
                      played: 0,
                      wins: 0,
                      draws: 0,
                      losses: 0,
                      goalsFor: 0,
                      goalsAgainst: 0,
                      goalDifference: 0,
                      points: 0
                    }));
                    setData(newData);
                    setMessage('✅ Estadísticas de la liga limpiadas correctamente');
                  }
                }}
                className="remove-btn"
                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
              >
                🗑️ Limpiar Tabla
              </button>
            </div>
            
            {/* Sección para ingresar resultados */}
            <div className="admin-subsection" style={{ background: '#1a1a2e', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid #ff6b35' }}>
              <h3 style={{ color: '#ffd23f', marginTop: 0 }}>⚽ Ingresar Resultado de Partido</h3>
              <div className="admin-note" style={{ background: '#1e3a5f', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                <strong>💡 Instrucciones:</strong> Selecciona los equipos y ingresa los goles. El sistema calculará automáticamente: 
                partidos jugados, victorias/empates/derrotas, diferencia de goles y puntos.
              </div>
              <div className="admin-match">
                <select
                  value={newResult.team1}
                  onChange={(e) => setNewResult({ ...newResult, team1: e.target.value })}
                  style={{ flex: 1, minWidth: '150px', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="">Selecciona Equipo 1</option>
                  {data.league.teams.map((team: Team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={newResult.goals1}
                  onChange={(e) => setNewResult({ ...newResult, goals1: e.target.value })}
                  placeholder="Goles"
                  style={{ width: '80px', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '6px', textAlign: 'center' }}
                  min="0"
                />
                <span>VS</span>
                <input
                  type="number"
                  value={newResult.goals2}
                  onChange={(e) => setNewResult({ ...newResult, goals2: e.target.value })}
                  placeholder="Goles"
                  style={{ width: '80px', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '6px', textAlign: 'center' }}
                  min="0"
                />
                <select
                  value={newResult.team2}
                  onChange={(e) => setNewResult({ ...newResult, team2: e.target.value })}
                  style={{ flex: 1, minWidth: '150px', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="">Selecciona Equipo 2</option>
                  {data.league.teams.map((team: Team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const { team1, team2, goals1, goals2 } = newResult;
                    
                    if (!team1 || !team2) {
                      setMessage('⚠️ Por favor selecciona ambos equipos');
                      return;
                    }
                    
                    if (team1 === team2) {
                      setMessage('⚠️ Los equipos deben ser diferentes');
                      return;
                    }
                    
                    const goals1Num = parseInt(goals1) || 0;
                    const goals2Num = parseInt(goals2) || 0;
                    
                    applyMatchResultToLeague(team1, goals1Num, team2, goals2Num);
                    
                    // Limpiar campos
                    setNewResult({ team1: '', team2: '', goals1: '', goals2: '' });
                    setMessage('✅ Resultado aplicado correctamente');
                  }}
                  className="save-btn"
                  style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  ✅ Aplicar Resultado
                </button>
              </div>
            </div>
            
            <div className="admin-note" style={{ background: '#1e3a5f', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>💡 Nota:</strong> También puedes editar manualmente las estadísticas en la tabla. Las estadísticas se calculan automáticamente 
              cuando editas goles a favor/en contra o victorias/empates/derrotas.
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Equipo</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {data.league.teams.map((team: Team, index: number) => (
                  <tr key={index}>
                    <td>{team.position}</td>
                    <td>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateLeagueTeam(index, 'name', e.target.value)}
                        className="admin-input-small"
                      />
                    </td>
                    <td>{team.played}</td>
                    <td>
                      <input
                        type="number"
                        value={team.wins}
                        onChange={(e) => updateLeagueTeam(index, 'wins', parseInt(e.target.value))}
                        className="admin-input-tiny"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={team.draws}
                        onChange={(e) => updateLeagueTeam(index, 'draws', parseInt(e.target.value))}
                        className="admin-input-tiny"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={team.losses}
                        onChange={(e) => updateLeagueTeam(index, 'losses', parseInt(e.target.value))}
                        className="admin-input-tiny"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={team.goalsFor}
                        onChange={(e) => updateLeagueTeam(index, 'goalsFor', parseInt(e.target.value))}
                        className="admin-input-tiny"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={team.goalsAgainst}
                        onChange={(e) => updateLeagueTeam(index, 'goalsAgainst', parseInt(e.target.value))}
                        className="admin-input-tiny"
                      />
                    </td>
                    <td style={{ color: team.goalDifference >= 0 ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                      {team.goalDifference}
                    </td>
                    <td style={{ color: '#ffd23f', fontWeight: '700' }}>
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>👥 Gestión de Equipos</h2>
              <button onClick={addTeam} className="add-btn">
                ➕ Añadir Equipo
              </button>
            </div>
            <div className="admin-note" style={{ background: '#1e3a5f', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>💡 Nota:</strong> Añade o edita equipos aquí. Puedes incluir los nombres de los jugadores. 
              Los equipos añadidos aparecerán en la tabla de liga.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {data.league.teams.map((team: Team, index: number) => (
                <div key={index} style={{ 
                  background: '#1a1a2e', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: `2px solid ${team.color || '#ff6b35'}`,
                  borderLeft: `6px solid ${team.color || '#ff6b35'}`
                }}>
                  <h3 style={{ marginTop: 0, color: '#ff6b35' }}>{team.name}</h3>
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => editTeam(team)} className="add-btn" style={{ flex: 1 }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => deleteTeam(index)} className="remove-btn" style={{ flex: 1 }}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📅 Partidos Próximos</h2>
              <button onClick={addUpcomingMatch} className="add-btn">
                ➕ Añadir Partido
              </button>
            </div>
            {data.upcomingMatches.map((match: any, index: number) => (
              <div key={match.id} className="admin-match">
                <select
                  value={match.team1}
                  onChange={(e) => updateUpcomingMatch(index, 'team1', e.target.value)}
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <option value="">Selecciona Equipo 1</option>
                  {data.league.teams.map((team: Team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
                </select>
                <span>VS</span>
                <select
                  value={match.team2}
                  onChange={(e) => updateUpcomingMatch(index, 'team2', e.target.value)}
                  style={{ flex: 1, minWidth: '150px' }}
                >
                  <option value="">Selecciona Equipo 2</option>
                  {data.league.teams.map((team: Team) => (
                    <option key={team.name} value={team.name}>{team.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={match.date}
                  onChange={(e) => updateUpcomingMatch(index, 'date', e.target.value)}
                  placeholder="Fecha"
                />
                <input
                  type="text"
                  value={match.time}
                  onChange={(e) => updateUpcomingMatch(index, 'time', e.target.value)}
                  placeholder="Hora"
                />
                <select
                  value={match.type}
                  onChange={(e) => updateUpcomingMatch(index, 'type', e.target.value)}
                >
                  <option value="Liga">Liga</option>
                  <option value="Copa">Copa</option>
                </select>
                <button
                  onClick={() => removeUpcomingMatch(index)}
                  className="remove-btn"
                  title="Eliminar partido"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="admin-actions">
          <button onClick={handleSave} disabled={loading} className="save-btn">
            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>

        {message && (
          <div className={`admin-message ${message.includes('✅') ? 'success' : 'info'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Modal para añadir/editar equipo */}
      {showGroupModal && editingGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '90%',
            border: '2px solid #ff6b35',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#ffd23f', marginBottom: '20px' }}>Editar Grupo: {editingGroup.name}</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px' }}>
                Nombre del Grupo:
              </label>
              <input
                type="text"
                value={editingGroup.name}
                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ff6b35',
                  background: '#0a0a0a',
                  color: '#fff'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px' }}>
                Equipos del Grupo (selecciona múltiples):
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #ff6b35',
                borderRadius: '6px',
                padding: '10px',
                background: '#0a0a0a'
              }}>
                {data.league.teams.map((team: Team) => (
                  <label key={team.name} style={{ 
                    display: 'block', 
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}>
                    <input
                      type="checkbox"
                      checked={editingGroup.teams.includes(team.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingGroup({ ...editingGroup, teams: [...editingGroup.teams, team.name] });
                        } else {
                          setEditingGroup({ ...editingGroup, teams: editingGroup.teams.filter(t => t !== team.name) });
                        }
                      }}
                      style={{ marginRight: '10px' }}
                    />
                    {team.name}
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '10px' }}>
                Equipos que avanzan a la siguiente fase:
              </label>
              <input
                type="number"
                min="1"
                max={editingGroup.teams.length}
                value={editingGroup.qualified?.length || 2}
                onChange={(e) => {
                  const num = parseInt(e.target.value) || 2;
                  setEditingGroup({ 
                    ...editingGroup, 
                    qualified: editingGroup.qualified?.slice(0, num) || []
                  });
                }}
                style={{
                  width: '100px',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ff6b35',
                  background: '#0a0a0a',
                  color: '#fff'
                }}
              />
              <p style={{ color: '#b0b0b0', fontSize: '0.85rem', marginTop: '5px' }}>
                Por defecto: 2 equipos por grupo avanzan
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setEditingGroup(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveGroup}
                style={{
                  padding: '10px 20px',
                  background: '#ff6b35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Guardar Grupo
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showTeamModal && editingTeam && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a2e',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            border: '2px solid #ff6b35'
          }}>
            <h2 style={{ marginTop: 0 }}>{editingTeam.name ? 'Editar Equipo' : 'Nuevo Equipo'}</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nombre del Equipo *</label>
              <input
                type="text"
                value={editingTeam.name}
                onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: '#fff' }}
                placeholder="Nombre del equipo"
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Color del equipo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {TEAM_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditingTeam({ ...editingTeam!, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: color,
                      border: editingTeam?.color === color ? '3px solid #fff' : '2px solid #666',
                      cursor: 'pointer',
                      boxShadow: editingTeam?.color === color ? '0 0 0 2px #ff6b35' : 'none'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowTeamModal(false); setEditingTeam(null); }}
                className="remove-btn"
              >
                Cancelar
              </button>
              <button onClick={saveTeam} className="save-btn">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
