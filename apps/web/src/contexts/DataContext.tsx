import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { useToast } from '../hooks/useToast'
import DataService, { 
  Player, 
  Event, 
  Transaction, 
  Account, 
  Category, 
  Injury, 
  Rival, 
  Play, 
  Resource, 
  Message, 
  Channel, 
  Attendance, 
  EventParticipant 
} from '../services/dataService'

// State interface
interface DataState {
  players: Player[]
  events: Event[]
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  injuries: Injury[]
  rivals: Rival[]
  plays: Play[]
  resources: Resource[]
  messages: { [channelId: number]: Message[] }
  channels: Channel[]
  attendance: Attendance[]
  eventParticipants: { [eventId: number]: EventParticipant[] }
  loading: {
    players: boolean
    events: boolean
    transactions: boolean
    accounts: boolean
    categories: boolean
    injuries: boolean
    rivals: boolean
    plays: boolean
    resources: boolean
    messages: boolean
    channels: boolean
    attendance: boolean
    eventParticipants: boolean
  }
  errors: {
    players: string | null
    events: string | null
    transactions: string | null
    accounts: string | null
    categories: string | null
    injuries: string | null
    rivals: string | null
    plays: string | null
    resources: string | null
    messages: string | null
    channels: string | null
    attendance: string | null
    eventParticipants: string | null
  }
}

// Action types
type DataAction =
  | { type: 'SET_LOADING'; payload: { key: keyof DataState['loading']; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: keyof DataState['errors']; error: string | null } }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: number }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'REMOVE_EVENT'; payload: number }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: number }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'SET_INJURIES'; payload: Injury[] }
  | { type: 'ADD_INJURY'; payload: Injury }
  | { type: 'UPDATE_INJURY'; payload: Injury }
  | { type: 'REMOVE_INJURY'; payload: number }
  | { type: 'SET_RIVALS'; payload: Rival[] }
  | { type: 'ADD_RIVAL'; payload: Rival }
  | { type: 'UPDATE_RIVAL'; payload: Rival }
  | { type: 'REMOVE_RIVAL'; payload: number }
  | { type: 'SET_PLAYS'; payload: Play[] }
  | { type: 'ADD_PLAY'; payload: Play }
  | { type: 'UPDATE_PLAY'; payload: Play }
  | { type: 'REMOVE_PLAY'; payload: number }
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'UPDATE_RESOURCE'; payload: Resource }
  | { type: 'REMOVE_RESOURCE'; payload: number }
  | { type: 'SET_MESSAGES'; payload: { channelId: number; messages: Message[] } }
  | { type: 'ADD_MESSAGE'; payload: { channelId: number; message: Message } }
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'ADD_CHANNEL'; payload: Channel }
  | { type: 'SET_ATTENDANCE'; payload: Attendance[] }
  | { type: 'ADD_ATTENDANCE'; payload: Attendance }
  | { type: 'UPDATE_ATTENDANCE'; payload: Attendance }
  | { type: 'SET_EVENT_PARTICIPANTS'; payload: { eventId: number; participants: EventParticipant[] } }
  | { type: 'ADD_EVENT_PARTICIPANT'; payload: { eventId: number; participant: EventParticipant } }
  | { type: 'UPDATE_EVENT_PARTICIPANT'; payload: { eventId: number; participant: EventParticipant } }
  | { type: 'REMOVE_EVENT_PARTICIPANT'; payload: { eventId: number; playerId: number } }

// Initial state
const initialState: DataState = {
  players: [],
  events: [],
  transactions: [],
  accounts: [],
  categories: [],
  injuries: [],
  rivals: [],
  plays: [],
  resources: [],
  messages: {},
  channels: [],
  attendance: [],
  eventParticipants: {},
  loading: {
    players: false,
    events: false,
    transactions: false,
    accounts: false,
    categories: false,
    injuries: false,
    rivals: false,
    plays: false,
    resources: false,
    messages: false,
    channels: false,
    attendance: false,
    eventParticipants: false,
  },
  errors: {
    players: null,
    events: null,
    transactions: null,
    accounts: null,
    categories: null,
    injuries: null,
    rivals: null,
    plays: null,
    resources: null,
    messages: null,
    channels: null,
    attendance: null,
    eventParticipants: null,
  },
}

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.loading,
        },
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.error,
        },
      }
    
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] }
    
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p => p.id === action.payload.id ? action.payload : p),
      }
    
    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.payload),
      }
    
    case 'SET_EVENTS':
      return { ...state, events: action.payload }
    
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] }
    
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
      }
    
    case 'REMOVE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
      }
    
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload }
    
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t),
      }
    
    case 'REMOVE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      }
    
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload }
    
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] }
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    
    case 'SET_INJURIES':
      return { ...state, injuries: action.payload }
    
    case 'ADD_INJURY':
      return { ...state, injuries: [...state.injuries, action.payload] }
    
    case 'UPDATE_INJURY':
      return {
        ...state,
        injuries: state.injuries.map(i => i.id === action.payload.id ? action.payload : i),
      }
    
    case 'REMOVE_INJURY':
      return {
        ...state,
        injuries: state.injuries.filter(i => i.id !== action.payload),
      }
    
    case 'SET_RIVALS':
      return { ...state, rivals: action.payload }
    
    case 'ADD_RIVAL':
      return { ...state, rivals: [...state.rivals, action.payload] }
    
    case 'UPDATE_RIVAL':
      return {
        ...state,
        rivals: state.rivals.map(r => r.id === action.payload.id ? action.payload : r),
      }
    
    case 'REMOVE_RIVAL':
      return {
        ...state,
        rivals: state.rivals.filter(r => r.id !== action.payload),
      }
    
    case 'SET_PLAYS':
      return { ...state, plays: action.payload }
    
    case 'ADD_PLAY':
      return { ...state, plays: [...state.plays, action.payload] }
    
    case 'UPDATE_PLAY':
      return {
        ...state,
        plays: state.plays.map(p => p.id === action.payload.id ? action.payload : p),
      }
    
    case 'REMOVE_PLAY':
      return {
        ...state,
        plays: state.plays.filter(p => p.id !== action.payload),
      }
    
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload }
    
    case 'ADD_RESOURCE':
      return { ...state, resources: [...state.resources, action.payload] }
    
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(r => r.id === action.payload.id ? action.payload : r),
      }
    
    case 'REMOVE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload),
      }
    
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.channelId]: action.payload.messages,
        },
      }
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.channelId]: [
            ...(state.messages[action.payload.channelId] || []),
            action.payload.message,
          ],
        },
      }
    
    case 'SET_CHANNELS':
      return { ...state, channels: action.payload }
    
    case 'ADD_CHANNEL':
      return { ...state, channels: [...state.channels, action.payload] }
    
    case 'SET_ATTENDANCE':
      return { ...state, attendance: action.payload }
    
    case 'ADD_ATTENDANCE':
      return { ...state, attendance: [...state.attendance, action.payload] }
    
    case 'UPDATE_ATTENDANCE':
      return {
        ...state,
        attendance: state.attendance.map(a => a.id === action.payload.id ? action.payload : a),
      }
    
    case 'SET_EVENT_PARTICIPANTS':
      return {
        ...state,
        eventParticipants: {
          ...state.eventParticipants,
          [action.payload.eventId]: action.payload.participants,
        },
      }
    
    case 'ADD_EVENT_PARTICIPANT':
      return {
        ...state,
        eventParticipants: {
          ...state.eventParticipants,
          [action.payload.eventId]: [
            ...(state.eventParticipants[action.payload.eventId] || []),
            action.payload.participant,
          ],
        },
      }
    
    case 'UPDATE_EVENT_PARTICIPANT':
      return {
        ...state,
        eventParticipants: {
          ...state.eventParticipants,
          [action.payload.eventId]: (state.eventParticipants[action.payload.eventId] || []).map(p =>
            p.playerId === action.payload.participant.playerId ? action.payload.participant : p
          ),
        },
      }
    
    case 'REMOVE_EVENT_PARTICIPANT':
      return {
        ...state,
        eventParticipants: {
          ...state.eventParticipants,
          [action.payload.eventId]: (state.eventParticipants[action.payload.eventId] || []).filter(
            p => p.playerId !== action.payload.playerId
          ),
        },
      }
    
    default:
      return state
  }
}

// Context interface
interface DataContextType {
  state: DataState
  dispatch: React.Dispatch<DataAction>
  
  // Players
  fetchPlayers: () => Promise<void>
  createPlayer: (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Player>
  updatePlayer: (id: number, player: Partial<Player>) => Promise<Player>
  deletePlayer: (id: number) => Promise<void>
  
  // Events
  fetchEvents: () => Promise<void>
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Event>
  updateEvent: (id: number, event: Partial<Event>) => Promise<Event>
  deleteEvent: (id: number) => Promise<void>
  
  // Transactions
  fetchTransactions: () => Promise<void>
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>
  updateTransaction: (id: number, transaction: Partial<Transaction>) => Promise<Transaction>
  deleteTransaction: (id: number) => Promise<void>
  
  // Accounts
  fetchAccounts: () => Promise<void>
  createAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>
  
  // Categories
  fetchCategories: () => Promise<void>
  createCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<Category>
  
  // Injuries
  fetchInjuries: () => Promise<void>
  createInjury: (injury: Omit<Injury, 'id' | 'createdAt'>) => Promise<Injury>
  updateInjury: (id: number, injury: Partial<Injury>) => Promise<Injury>
  deleteInjury: (id: number) => Promise<void>
  
  // Rivals
  fetchRivals: () => Promise<void>
  createRival: (rival: Omit<Rival, 'id' | 'createdAt'>) => Promise<Rival>
  updateRival: (id: number, rival: Partial<Rival>) => Promise<Rival>
  deleteRival: (id: number) => Promise<void>
  
  // Plays
  fetchPlays: () => Promise<void>
  createPlay: (play: Omit<Play, 'id' | 'createdAt'>) => Promise<Play>
  updatePlay: (id: number, play: Partial<Play>) => Promise<Play>
  deletePlay: (id: number) => Promise<void>
  
  // Resources
  fetchResources: () => Promise<void>
  createResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => Promise<Resource>
  updateResource: (id: number, resource: Partial<Resource>) => Promise<Resource>
  deleteResource: (id: number) => Promise<void>
  
  // Messages
  fetchMessages: (channelId: number) => Promise<void>
  sendMessage: (channelId: number, content: string) => Promise<Message>
  
  // Channels
  fetchChannels: () => Promise<void>
  createChannel: (channel: Omit<Channel, 'id' | 'createdAt'>) => Promise<Channel>
  
  // Attendance
  fetchAttendance: () => Promise<void>
  createAttendance: (attendance: Omit<Attendance, 'id' | 'createdAt'>) => Promise<Attendance>
  updateAttendance: (id: number, attendance: Partial<Attendance>) => Promise<Attendance>
  
  // Event Participants
  fetchEventParticipants: (eventId: number) => Promise<void>
  addEventParticipant: (eventId: number, playerId: number, role?: string) => Promise<EventParticipant>
  updateEventParticipant: (eventId: number, playerId: number, participant: Partial<EventParticipant>) => Promise<EventParticipant>
  removeEventParticipant: (eventId: number, playerId: number) => Promise<void>
  
  // Utility functions
  formatCurrency: (amountCents: number) => string
  formatDate: (date: string | Date) => string
  formatDateTime: (date: string | Date) => string
  formatRelativeTime: (date: string | Date) => string
}

// Create context
const DataContext = createContext<DataContextType | undefined>(undefined)

// Provider component
interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const [state, dispatch] = useReducer(dataReducer, initialState)
  const { showErrorToast, showSuccessToast } = useToast()

  // Helper function to handle API calls
  const handleApiCall = async <T,>(
    apiCall: () => Promise<T>,
    loadingKey: keyof DataState['loading'],
    errorKey: keyof DataState['errors'],
    successMessage?: string
  ): Promise<T> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, loading: true } })
      dispatch({ type: 'SET_ERROR', payload: { key: errorKey, error: null } })
      
      const result = await apiCall()
      
      if (successMessage) {
        showSuccessToast(successMessage)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      dispatch({ type: 'SET_ERROR', payload: { key: errorKey, error: errorMessage } })
      showErrorToast(errorMessage)
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: loadingKey, loading: false } })
    }
  }

  // Players
  const fetchPlayers = async () => {
    const players = await handleApiCall(
      () => DataService.getPlayers(),
      'players',
      'players'
    )
    dispatch({ type: 'SET_PLAYERS', payload: players })
  }

  const createPlayer = async (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlayer = await handleApiCall(
      () => DataService.createPlayer(player),
      'players',
      'players',
      'Jugador creado exitosamente'
    )
    dispatch({ type: 'ADD_PLAYER', payload: newPlayer })
    return newPlayer
  }

  const updatePlayer = async (id: number, player: Partial<Player>) => {
    const updatedPlayer = await handleApiCall(
      () => DataService.updatePlayer(id, player),
      'players',
      'players',
      'Jugador actualizado exitosamente'
    )
    dispatch({ type: 'UPDATE_PLAYER', payload: updatedPlayer })
    return updatedPlayer
  }

  const deletePlayer = async (id: number) => {
    await handleApiCall(
      () => DataService.deletePlayer(id),
      'players',
      'players',
      'Jugador eliminado exitosamente'
    )
    dispatch({ type: 'REMOVE_PLAYER', payload: id })
  }

  // Events
  const fetchEvents = async () => {
    const events = await handleApiCall(
      () => DataService.getEvents(),
      'events',
      'events'
    )
    dispatch({ type: 'SET_EVENTS', payload: events })
  }

  const createEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent = await handleApiCall(
      () => DataService.createEvent(event),
      'events',
      'events',
      'Evento creado exitosamente'
    )
    dispatch({ type: 'ADD_EVENT', payload: newEvent })
    return newEvent
  }

  const updateEvent = async (id: number, event: Partial<Event>) => {
    const updatedEvent = await handleApiCall(
      () => DataService.updateEvent(id, event),
      'events',
      'events',
      'Evento actualizado exitosamente'
    )
    dispatch({ type: 'UPDATE_EVENT', payload: updatedEvent })
    return updatedEvent
  }

  const deleteEvent = async (id: number) => {
    await handleApiCall(
      () => DataService.deleteEvent(id),
      'events',
      'events',
      'Evento eliminado exitosamente'
    )
    dispatch({ type: 'REMOVE_EVENT', payload: id })
  }

  // Transactions
  const fetchTransactions = async () => {
    const transactions = await handleApiCall(
      () => DataService.getTransactions(),
      'transactions',
      'transactions'
    )
    dispatch({ type: 'SET_TRANSACTIONS', payload: transactions })
  }

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction = await handleApiCall(
      () => DataService.createTransaction(transaction),
      'transactions',
      'transactions',
      'Transacción creada exitosamente'
    )
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction })
    return newTransaction
  }

  const updateTransaction = async (id: number, transaction: Partial<Transaction>) => {
    const updatedTransaction = await handleApiCall(
      () => DataService.updateTransaction(id, transaction),
      'transactions',
      'transactions',
      'Transacción actualizada exitosamente'
    )
    dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction })
    return updatedTransaction
  }

  const deleteTransaction = async (id: number) => {
    await handleApiCall(
      () => DataService.deleteTransaction(id),
      'transactions',
      'transactions',
      'Transacción eliminada exitosamente'
    )
    dispatch({ type: 'REMOVE_TRANSACTION', payload: id })
  }

  // Accounts
  const fetchAccounts = async () => {
    const accounts = await handleApiCall(
      () => DataService.getAccounts(),
      'accounts',
      'accounts'
    )
    dispatch({ type: 'SET_ACCOUNTS', payload: accounts })
  }

  const createAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount = await handleApiCall(
      () => DataService.createAccount(account),
      'accounts',
      'accounts',
      'Cuenta creada exitosamente'
    )
    dispatch({ type: 'ADD_ACCOUNT', payload: newAccount })
    return newAccount
  }

  // Categories
  const fetchCategories = async () => {
    const categories = await handleApiCall(
      () => DataService.getCategories(),
      'categories',
      'categories'
    )
    dispatch({ type: 'SET_CATEGORIES', payload: categories })
  }

  const createCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory = await handleApiCall(
      () => DataService.createCategory(category),
      'categories',
      'categories',
      'Categoría creada exitosamente'
    )
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory })
    return newCategory
  }

  // Injuries
  const fetchInjuries = async () => {
    const injuries = await handleApiCall(
      () => DataService.getInjuries(),
      'injuries',
      'injuries'
    )
    dispatch({ type: 'SET_INJURIES', payload: injuries })
  }

  const createInjury = async (injury: Omit<Injury, 'id' | 'createdAt'>) => {
    const newInjury = await handleApiCall(
      () => DataService.createInjury(injury),
      'injuries',
      'injuries',
      'Lesión registrada exitosamente'
    )
    dispatch({ type: 'ADD_INJURY', payload: newInjury })
    return newInjury
  }

  const updateInjury = async (id: number, injury: Partial<Injury>) => {
    const updatedInjury = await handleApiCall(
      () => DataService.updateInjury(id, injury),
      'injuries',
      'injuries',
      'Lesión actualizada exitosamente'
    )
    dispatch({ type: 'UPDATE_INJURY', payload: updatedInjury })
    return updatedInjury
  }

  const deleteInjury = async (id: number) => {
    await handleApiCall(
      () => DataService.deleteInjury(id),
      'injuries',
      'injuries',
      'Lesión eliminada exitosamente'
    )
    dispatch({ type: 'REMOVE_INJURY', payload: id })
  }

  // Rivals
  const fetchRivals = async () => {
    const rivals = await handleApiCall(
      () => DataService.getRivals(),
      'rivals',
      'rivals'
    )
    dispatch({ type: 'SET_RIVALS', payload: rivals })
  }

  const createRival = async (rival: Omit<Rival, 'id' | 'createdAt'>) => {
    const newRival = await handleApiCall(
      () => DataService.createRival(rival),
      'rivals',
      'rivals',
      'Rival creado exitosamente'
    )
    dispatch({ type: 'ADD_RIVAL', payload: newRival })
    return newRival
  }

  const updateRival = async (id: number, rival: Partial<Rival>) => {
    const updatedRival = await handleApiCall(
      () => DataService.updateRival(id, rival),
      'rivals',
      'rivals',
      'Rival actualizado exitosamente'
    )
    dispatch({ type: 'UPDATE_RIVAL', payload: updatedRival })
    return updatedRival
  }

  const deleteRival = async (id: number) => {
    await handleApiCall(
      () => DataService.deleteRival(id),
      'rivals',
      'rivals',
      'Rival eliminado exitosamente'
    )
    dispatch({ type: 'REMOVE_RIVAL', payload: id })
  }

  // Plays
  const fetchPlays = async () => {
    const plays = await handleApiCall(
      () => DataService.getPlays(),
      'plays',
      'plays'
    )
    dispatch({ type: 'SET_PLAYS', payload: plays })
  }

  const createPlay = async (play: Omit<Play, 'id' | 'createdAt'>) => {
    const newPlay = await handleApiCall(
      () => DataService.createPlay(play),
      'plays',
      'plays',
      'Jugada creada exitosamente'
    )
    dispatch({ type: 'ADD_PLAY', payload: newPlay })
    return newPlay
  }

  const updatePlay = async (id: number, play: Partial<Play>) => {
    const updatedPlay = await handleApiCall(
      () => DataService.updatePlay(id, play),
      'plays',
      'plays',
      'Jugada actualizada exitosamente'
    )
    dispatch({ type: 'UPDATE_PLAY', payload: updatedPlay })
    return updatedPlay
  }

  const deletePlay = async (id: number) => {
    await handleApiCall(
      () => DataService.deletePlay(id),
      'plays',
      'plays',
      'Jugada eliminada exitosamente'
    )
    dispatch({ type: 'REMOVE_PLAY', payload: id })
  }

  // Resources
  const fetchResources = async () => {
    const resources = await handleApiCall(
      () => DataService.getResources(),
      'resources',
      'resources'
    )
    dispatch({ type: 'SET_RESOURCES', payload: resources })
  }

  const createResource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
    const newResource = await handleApiCall(
      () => DataService.createResource(resource),
      'resources',
      'resources',
      'Recurso creado exitosamente'
    )
    dispatch({ type: 'ADD_RESOURCE', payload: newResource })
    return newResource
  }

  const updateResource = async (id: number, resource: Partial<Resource>) => {
    const updatedResource = await handleApiCall(
      () => DataService.updateResource(id, resource),
      'resources',
      'resources',
      'Recurso actualizado exitosamente'
    )
    dispatch({ type: 'UPDATE_RESOURCE', payload: updatedResource })
    return updatedResource
  }

  const deleteResource = async (id: number) => {
    await handleApiCall(
      () => DataService.deleteResource(id),
      'resources',
      'resources',
      'Recurso eliminado exitosamente'
    )
    dispatch({ type: 'REMOVE_RESOURCE', payload: id })
  }

  // Messages
  const fetchMessages = async (channelId: number) => {
    const messages = await handleApiCall(
      () => DataService.getMessages(channelId),
      'messages',
      'messages'
    )
    dispatch({ type: 'SET_MESSAGES', payload: { channelId, messages } })
  }

  const sendMessage = async (channelId: number, content: string) => {
    const newMessage = await handleApiCall(
      () => DataService.createMessage(channelId, content),
      'messages',
      'messages'
    )
    dispatch({ type: 'ADD_MESSAGE', payload: { channelId, message: newMessage } })
    return newMessage
  }

  // Channels
  const fetchChannels = async () => {
    const channels = await handleApiCall(
      () => DataService.getChannels(),
      'channels',
      'channels'
    )
    dispatch({ type: 'SET_CHANNELS', payload: channels })
  }

  const createChannel = async (channel: Omit<Channel, 'id' | 'createdAt'>) => {
    const newChannel = await handleApiCall(
      () => DataService.createChannel(channel),
      'channels',
      'channels',
      'Canal creado exitosamente'
    )
    dispatch({ type: 'ADD_CHANNEL', payload: newChannel })
    return newChannel
  }

  // Attendance
  const fetchAttendance = async () => {
    const attendance = await handleApiCall(
      () => DataService.getAttendance(),
      'attendance',
      'attendance'
    )
    dispatch({ type: 'SET_ATTENDANCE', payload: attendance })
  }

  const createAttendance = async (attendance: Omit<Attendance, 'id' | 'createdAt'>) => {
    const newAttendance = await handleApiCall(
      () => DataService.createAttendance(attendance),
      'attendance',
      'attendance',
      'Asistencia registrada exitosamente'
    )
    dispatch({ type: 'ADD_ATTENDANCE', payload: newAttendance })
    return newAttendance
  }

  const updateAttendance = async (id: number, attendance: Partial<Attendance>) => {
    const updatedAttendance = await handleApiCall(
      () => DataService.updateAttendance(id, attendance),
      'attendance',
      'attendance',
      'Asistencia actualizada exitosamente'
    )
    dispatch({ type: 'UPDATE_ATTENDANCE', payload: updatedAttendance })
    return updatedAttendance
  }

  // Event Participants
  const fetchEventParticipants = async (eventId: number) => {
    const participants = await handleApiCall(
      () => DataService.getEventParticipants(eventId),
      'eventParticipants',
      'eventParticipants'
    )
    dispatch({ type: 'SET_EVENT_PARTICIPANTS', payload: { eventId, participants } })
  }

  const addEventParticipant = async (eventId: number, playerId: number, role?: string) => {
    const newParticipant = await handleApiCall(
      () => DataService.addEventParticipant(eventId, playerId, role),
      'eventParticipants',
      'eventParticipants',
      'Participante agregado exitosamente'
    )
    dispatch({ type: 'ADD_EVENT_PARTICIPANT', payload: { eventId, participant: newParticipant } })
    return newParticipant
  }

  const updateEventParticipant = async (eventId: number, playerId: number, participant: Partial<EventParticipant>) => {
    const updatedParticipant = await handleApiCall(
      () => DataService.updateEventParticipant(eventId, playerId, participant),
      'eventParticipants',
      'eventParticipants',
      'Participante actualizado exitosamente'
    )
    dispatch({ type: 'UPDATE_EVENT_PARTICIPANT', payload: { eventId, participant: updatedParticipant } })
    return updatedParticipant
  }

  const removeEventParticipant = async (eventId: number, playerId: number) => {
    await handleApiCall(
      () => DataService.removeEventParticipant(eventId, playerId),
      'eventParticipants',
      'eventParticipants',
      'Participante removido exitosamente'
    )
    dispatch({ type: 'REMOVE_EVENT_PARTICIPANT', payload: { eventId, playerId } })
  }

  // Utility functions
  const formatCurrency = DataService.formatCurrency
  const formatDate = DataService.formatDate
  const formatDateTime = DataService.formatDateTime
  const formatRelativeTime = DataService.formatRelativeTime

  const value: DataContextType = {
    state,
    dispatch,
    
    // Players
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    
    // Events
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    
    // Transactions
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Accounts
    fetchAccounts,
    createAccount,
    
    // Categories
    fetchCategories,
    createCategory,
    
    // Injuries
    fetchInjuries,
    createInjury,
    updateInjury,
    deleteInjury,
    
    // Rivals
    fetchRivals,
    createRival,
    updateRival,
    deleteRival,
    
    // Plays
    fetchPlays,
    createPlay,
    updatePlay,
    deletePlay,
    
    // Resources
    fetchResources,
    createResource,
    updateResource,
    deleteResource,
    
    // Messages
    fetchMessages,
    sendMessage,
    
    // Channels
    fetchChannels,
    createChannel,
    
    // Attendance
    fetchAttendance,
    createAttendance,
    updateAttendance,
    
    // Event Participants
    fetchEventParticipants,
    addEventParticipant,
    updateEventParticipant,
    removeEventParticipant,
    
    // Utility functions
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRelativeTime,
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

// Hook to use the data context
export function useDataContext() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider')
  }
  return context
}
