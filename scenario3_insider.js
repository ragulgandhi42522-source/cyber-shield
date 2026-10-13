/**
 * Scenario 3: Insider Data Exfiltration (Advanced)
 * Case: A senior systems administrator staging stealth exfiltration using steganography,
 * timestomped metadata, hidden alternate data streams, and fragmented archives.
 */

export const scenario3 = {
  id: 'INS-003',
  name: 'Insider Data Exfiltration',
  difficulty: 'ADVANCED',
  duration: '35-50 mins',
  xp: 1000,
  description: 'A sophisticated insider threat case featuring timestomping inconsistencies, steganographic image payloads, wiped event channels, and multi-part deleted encrypted RAR archives.',
  targetFilesCount: 40,
  hiddenFilesCount: 8,
  deletedFilesCount: 15,
  corruptedFilesCount: 5,
  keyEvidenceCount: 7,

  files: [
    {
      id: 'i_001',
      name: 'datacenter_blueprint.png',
      path: '/Users/Alex/Pictures/',
      type: 'PNG',
      size: '4.8 MB',
      status: 'ACTIVE',
      recoverable: true,
      hidden: false,
      created: '2026-09-18 14:00',
      modified: '2026-09-18 14:00',
      accessed: '2026-09-18 22:30',
      deleted: null,
      hash: 'SIM-STEGO-PNG',
      importance: 'HIGH',
      isKeyEvidence: true,
      owner: 'alex.mercer',
      contentPreview: 'STEGANOGRAPHIC PAYLOAD DETECTED in LSB (Least Significant Bit) channels.\nExtracted embedded archive: root_keys_prod.tar.gz (size: 614 KB).\nEncrypted with AES-256.',
      hexData: '89 50 4E 47 0D 0A 1A 0A  00 00 00 0D 49 48 44 52  .PNG........IHDR\n00 00 10 00 00 00 0C 00  08 06 00 00 00 23 88 19  .............#..\n53 74 65 67 6F 4C 53 42  5F 50 41 59 4C 4F 41 44  StegoLSB_PAYLOAD',
      anomalyNotes: 'Appears as innocent blueprint image but contains concealed cryptographic keys'
    },
    {
      id: 'i_002',
      name: 'exfil_chunk_part01.enc',
      path: '/Recycle_Bin/',
      type: 'LOG',
      size: '1.2 MB',
      status: 'DELETED',
      recoverable: true,
      hidden: false,
      created: '2026-09-18 22:10',
      modified: '2026-09-18 22:15',
      accessed: '2026-09-18 22:35',
      deleted: '2026-09-18 22:40',
      hash: 'SIM-ENCCHUNK01',
      importance: 'HIGH',
      isKeyEvidence: true,
      owner: 'alex.mercer',
      contentPreview: 'Encrypted payload fragment 1 of 3: OpenSSL salt: Saltd__99a2c1f8019b\nCipher: chacha20-poly1305\nRecipient address: 185.220.101.5',
      hexData: '53 61 6C 74 65 64 5F 5F  99 A2 C1 F8 01 9B 42 11  Salted__......B.\n7A 89 C3 44 10 99 21 AA  FF 00 44 21 88 99 BB CC  z..D..!...D!....',
      anomalyNotes: 'Encrypted chunk purged from recycle bin'
    },
    {
      id: 'i_003',
      name: 'timestomped_system_dll.log',
      path: '/System/Logs/',
      type: 'LOG',
      size: '32 KB',
      status: 'ACTIVE',
      recoverable: true,
      hidden: false,
      created: '2020-01-01 00:00', // Timestomped fake old date
      modified: '2020-01-01 00:00',
      accessed: '2026-09-18 22:30',
      deleted: null,
      hash: 'SIM-TIMESTOMP8',
      importance: 'HIGH',
      isKeyEvidence: true,
      owner: 'SYSTEM',
      contentPreview: '[METADATA ANOMALY: TIMESTOMPING DETECTED]\n$STANDARD_INFORMATION: 2020-01-01 00:00:00\n$FILE_NAME attribute: 2026-09-18 22:28:14\nDiscrepancy confirms timestamps were forged using SetFileTime API.',
      hexData: '5B 4D 45 54 41 44 41 54  41 5D 20 54 69 6D 65 73  [METADATA] Times\n74 6F 6D 70 65 64 20 44  4C 4C 20 6C 6F 67 20 61  tomped DLL log a',
      anomalyNotes: 'Timestomping anomaly: File created in 2026 forged to show year 2020'
    },
    {
      id: 'i_004',
      name: '.tor_circuit_nodes.txt',
      path: '/Hidden_Data/',
      type: 'TXT',
      size: '3 KB',
      status: 'HIDDEN',
      recoverable: true,
      hidden: true,
      created: '2026-09-18 21:50',
      modified: '2026-09-18 22:05',
      accessed: '2026-09-18 22:35',
      deleted: null,
      hash: 'SIM-TORCIRCUIT',
      importance: 'HIGH',
      isKeyEvidence: true,
      owner: 'alex.mercer',
      contentPreview: 'Tor SOCKS5 Proxy config: 127.0.0.1:9050\nExit Node: 185.220.101.5 (Germany - Guard/Exit)\nTarget hidden service: exfilgate77a9b0c.onion:8080',
      hexData: '54 6F 72 20 53 4F 43 4B  53 35 20 50 72 6F 78 79  Tor SOCKS5 Proxy\n20 63 6F 6E 66 69 67 3A  20 31 32 37 2E 30 2E 30   config: 127.0.0',
      anomalyNotes: 'Hidden Tor proxy configuration used for covert exfiltration'
    }
  ],

  groundTruthTimeline: [
    {
      id: 'i_evt_1',
      time: '09:50 PM',
      fullTimestamp: '2026-09-18 21:50',
      title: 'Tor Circuit Initialized',
      description: 'Covert anonymity proxy launched on port 9050 routing to onion hidden service.',
      sourceFile: '.tor_circuit_nodes.txt',
      isPivotal: true
    },
    {
      id: 'i_evt_2',
      time: '10:00 PM',
      fullTimestamp: '2026-09-18 22:00',
      title: 'Steganographic Carrier Injected',
      description: 'LSB injection encoded proprietary keys inside datacenter_blueprint.png.',
      sourceFile: 'datacenter_blueprint.png',
      isPivotal: true
    },
    {
      id: 'i_evt_3',
      time: '10:28 PM',
      fullTimestamp: '2026-09-18 22:28',
      title: 'MFT Timestomping Attack',
      description: 'Modified $STANDARD_INFORMATION timestamps to forged date 2020-01-01.',
      sourceFile: 'timestomped_system_dll.log',
      isPivotal: true
    },
    {
      id: 'i_evt_4',
      time: '10:40 PM',
      fullTimestamp: '2026-09-18 22:40',
      title: 'Purge of Encrypted Payload Chunks',
      description: 'Encrypted chunk files deleted and sent to Recycle Bin.',
      sourceFile: 'exfil_chunk_part01.enc',
      isPivotal: true
    }
  ],

  expectedEvidenceIds: ['i_001', 'i_002', 'i_003', 'i_004']
};
