import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QueryConstraint,
  DocumentData,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../constants';
import {
  Match,
  Team,
  Player,
  PlayingXI,
  Innings,
  ScoreEvent,
  Commentary,
  Tournament,
  UserProfile,
} from '../types';

// Generic helpers
function docToData<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
  const data = doc.data();
  // Convert Timestamps to ISO strings
  const converted: DocumentData = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      converted[key] = (data[key] as Timestamp).toDate().toISOString();
    } else {
      converted[key] = data[key];
    }
  }
  return { id: doc.id, ...converted } as T;
}

// ===== MATCHES =====
export async function getMatches(filters?: { hosterId?: string; status?: string; location?: string; tournamentName?: string }): Promise<Match[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.hosterId) constraints.push(where('hosterId', '==', filters.hosterId));
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.location) constraints.push(where('location', '==', filters.location));
  if (filters?.tournamentName) constraints.push(where('tournamentName', '==', filters.tournamentName));
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, COLLECTIONS.MATCHES), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<Match>(d));
}

export async function getMatch(id: string): Promise<Match | null> {
  const d = await getDoc(doc(db, COLLECTIONS.MATCHES, id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Match;
}

export async function createMatch(data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.MATCHES), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMatch(id: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.MATCHES, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMatch(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.MATCHES, id));
}

export function subscribeToMatch(id: string, callback: (match: Match | null) => void) {
  return onSnapshot(doc(db, COLLECTIONS.MATCHES, id), (d) => {
    if (d.exists()) {
      const data = d.data();
      const converted: DocumentData = {};
      for (const key in data) {
        if (data[key] instanceof Timestamp) {
          converted[key] = (data[key] as Timestamp).toDate().toISOString();
        } else {
          converted[key] = data[key];
        }
      }
      callback({ id: d.id, ...converted } as Match);
    } else {
      callback(null);
    }
  });
}

export function subscribeToMatches(filters: { status?: string; hosterId?: string }, callback: (matches: Match[]) => void) {
  const constraints: QueryConstraint[] = [];
  if (filters.hosterId) constraints.push(where('hosterId', '==', filters.hosterId));
  if (filters.status) constraints.push(where('status', '==', filters.status));
  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, COLLECTIONS.MATCHES), ...constraints);
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => docToData<Match>(d)));
  });
}

// ===== TEAMS =====
export async function getTeams(hosterId?: string): Promise<Team[]> {
  const constraints: QueryConstraint[] = [];
  if (hosterId) constraints.push(where('hosterId', '==', hosterId));
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(collection(db, COLLECTIONS.TEAMS), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<Team>(d));
}

export async function getTeam(id: string): Promise<Team | null> {
  const d = await getDoc(doc(db, COLLECTIONS.TEAMS, id));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Team;
}

export async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.TEAMS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TEAMS, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTeam(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TEAMS, id));
}

// ===== PLAYERS =====
export async function getPlayers(filters?: { hosterId?: string; teamId?: string }): Promise<Player[]> {
  const constraints: QueryConstraint[] = [];
  if (filters?.hosterId) constraints.push(where('hosterId', '==', filters.hosterId));
  if (filters?.teamId) constraints.push(where('teamId', '==', filters.teamId));
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(collection(db, COLLECTIONS.PLAYERS), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<Player>(d));
}

export async function createPlayer(data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.PLAYERS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePlayer(id: string, data: Partial<Player>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.PLAYERS, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePlayer(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.PLAYERS, id));
}

// ===== PLAYING XI =====
export async function getPlayingXI(matchId: string, teamId: string): Promise<PlayingXI | null> {
  const q = query(
    collection(db, COLLECTIONS.PLAYING_XI),
    where('matchId', '==', matchId),
    where('teamId', '==', teamId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return docToData<PlayingXI>(snapshot.docs[0]);
}

export async function setPlayingXI(data: Omit<PlayingXI, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const existing = await getPlayingXI(data.matchId, data.teamId);
  if (existing) {
    await updateDoc(doc(db, COLLECTIONS.PLAYING_XI, existing.id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return existing.id;
  }
  const ref = await addDoc(collection(db, COLLECTIONS.PLAYING_XI), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToPlayingXI(matchId: string, callback: (xis: PlayingXI[]) => void) {
  const q = query(collection(db, COLLECTIONS.PLAYING_XI), where('matchId', '==', matchId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => docToData<PlayingXI>(d)));
  });
}

// ===== INNINGS =====
export async function getInnings(matchId: string): Promise<Innings[]> {
  const q = query(
    collection(db, COLLECTIONS.INNINGS),
    where('matchId', '==', matchId),
    orderBy('inningsNumber', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<Innings>(d));
}

export async function createInnings(data: Omit<Innings, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.INNINGS), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateInnings(id: string, data: Partial<Innings>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.INNINGS, id), { ...data, updatedAt: serverTimestamp() });
}

export function subscribeToInnings(matchId: string, callback: (innings: Innings[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.INNINGS),
    where('matchId', '==', matchId),
    orderBy('inningsNumber', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => docToData<Innings>(d)));
  });
}

// ===== SCORE EVENTS =====
export async function addScoreEvent(data: Omit<ScoreEvent, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.SCORE_EVENTS), data);
  return ref.id;
}

export async function getScoreEvents(matchId: string, inningsNumber?: number): Promise<ScoreEvent[]> {
  const constraints: QueryConstraint[] = [where('matchId', '==', matchId)];
  if (inningsNumber) constraints.push(where('inningsNumber', '==', inningsNumber));
  constraints.push(orderBy('timestamp', 'asc'));
  const q = query(collection(db, COLLECTIONS.SCORE_EVENTS), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<ScoreEvent>(d));
}

export async function deleteLastScoreEvent(matchId: string, inningsNumber: number): Promise<ScoreEvent | null> {
  const q = query(
    collection(db, COLLECTIONS.SCORE_EVENTS),
    where('matchId', '==', matchId),
    where('inningsNumber', '==', inningsNumber),
    orderBy('timestamp', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const event = docToData<ScoreEvent>(snapshot.docs[0]);
  await deleteDoc(doc(db, COLLECTIONS.SCORE_EVENTS, event.id));
  return event;
}

// ===== COMMENTARY =====
export async function addCommentary(data: Omit<Commentary, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.COMMENTARY), data);
  return ref.id;
}

export async function getCommentary(matchId: string, lastDoc?: QueryDocumentSnapshot<DocumentData>): Promise<{ comments: Commentary[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> {
  const constraints: QueryConstraint[] = [
    where('matchId', '==', matchId),
    orderBy('timestamp', 'desc'),
    limit(20),
  ];
  if (lastDoc) constraints.push(startAfter(lastDoc));
  const q = query(collection(db, COLLECTIONS.COMMENTARY), ...constraints);
  const snapshot = await getDocs(q);
  return {
    comments: snapshot.docs.map((d) => docToData<Commentary>(d)),
    lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  };
}

export function subscribeToCommentary(matchId: string, callback: (comments: Commentary[]) => void) {
  const q = query(
    collection(db, COLLECTIONS.COMMENTARY),
    where('matchId', '==', matchId),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => docToData<Commentary>(d)));
  });
}

// ===== TOURNAMENTS =====
export async function getTournaments(hosterId?: string): Promise<Tournament[]> {
  const constraints: QueryConstraint[] = [];
  if (hosterId) constraints.push(where('hosterId', '==', hosterId));
  constraints.push(orderBy('createdAt', 'desc'));
  const q = query(collection(db, COLLECTIONS.TOURNAMENTS), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToData<Tournament>(d));
}

export async function createTournament(data: { name: string; hosterId: string }): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.TOURNAMENTS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ===== USER PROFILE =====
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const d = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!d.exists()) return null;
  return { ...d.data() } as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), { ...data, updatedAt: serverTimestamp() });
}

// ===== BATCH OPERATIONS =====
export async function batchUpdateMatchAndInnings(
  matchId: string,
  matchData: Partial<Match>,
  inningsId: string,
  inningsData: Partial<Innings>
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.MATCHES, matchId), { ...matchData, updatedAt: serverTimestamp() });
  batch.update(doc(db, COLLECTIONS.INNINGS, inningsId), { ...inningsData, updatedAt: serverTimestamp() });
  await batch.commit();
}
