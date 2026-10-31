/**
 * ============================================================================
 * BLINDSPOT — FLOOR 3 EXPANSION, RED-EYED SHADOW ENTITY & MAINTENANCE 3B MODULE
 * File: ./floorThreeExpansion.js
 * ============================================================================
 * Mencakup:
 * 1. Rombakan Visual Entitas: Siluet bayangan hitam pekat murni (0x010101,
 *    roughness: 1.0, metalness: 0.0, menyerap cahaya) dengan vertex animation
 *    bergelombang halus menyerupai asap padat + sepasang mata merah menyala
 *    tajam (2 Sphere MeshBasicMaterial 0xff0000 + PointLight #ff0000, intensitas 1.8,
 *    jarak 2.5m). Berpindah posisi/sudut saat berkedip [Spacebar] diiringi
 *    sfx_entity_breathing_dark.mp3.
 * 2. Revisi Kunci Kamar 304 menjadi Kunci "Ruang Panel 3B / Maintenance 3B"
 *    (hasMaintenanceKey = true) + monolog maya_examine_key_fix.mp3 (10000ms,
 *    isMayaSpeaking = true) + objektif baru.
 * 3. Kemunculan Mata Merah di Koridor Luar saat keluar Kamar 304:
 *    Lampu darurat lobi padam berderak, sepasang mata merah muncul di dekat lift,
 *    putar sfx_red_eyes_appear.mp3 + monolog maya_spot_red_eyes.mp3 (12000ms,
 *    isMayaSpeaking = true).
 * 4. Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY") di dinding
 *    lobi seberang lift dengan collider terkunci yang hanya merespons [E] jika
 *    hasMaintenanceKey === true.
 * ============================================================================
 */
(function (window) {
  'use strict';
  window.Blindspot = window.Blindspot || {};

  /**
   * Factory Wujud Baru Entitas:
   * - Tubuh bayangan hitam pekat murni (color: 0x010101, roughness: 1.0, metalness: 0.0)
   *   tanpa detail wajah/mulut/baju, menyerap sorotan senter.
   * - Dilengkapi data vertex asli untuk animasi gelombang asap padat (wavy vertex animation).
   * - Kepala hanya memiliki sepasang mata merah menyala tajam (2 Sphere 0xff0000 + PointLight 1.8, 2.5m).
   */
  function createShadowRedEyesEntity(THREE) {
    const entityGroup = new THREE.Group();

    const pureShadowMat = new THREE.MeshStandardMaterial({
      color: 0x010101,
      roughness: 1.0,
      metalness: 0.0
    });

    // Geometri siluet asap padat bersegmen rapat untuk vertex wave animation
    const smokeBodyGeo = new THREE.CylinderGeometry(0.15, 0.36, 2.22, 20, 28);
    const posAttr = smokeBodyGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.array.length);
    basePositions.set(posAttr.array);
    smokeBodyGeo.userData.basePositions = basePositions;

    const smokeBodyMesh = new THREE.Mesh(smokeBodyGeo, pureShadowMat);
    smokeBodyMesh.position.set(0, 1.11, 0);
    entityGroup.add(smokeBodyMesh);

    // Bagian kepala menyatu hitam pekat tanpa wajah/mulut
    const shadowHeadGeo = new THREE.SphereGeometry(0.19, 18, 18);
    shadowHeadGeo.scale(0.88, 1.28, 0.92);
    const shadowHeadMesh = new THREE.Mesh(shadowHeadGeo, pureShadowMat);
    shadowHeadMesh.position.set(0, 2.05, 0);
    entityGroup.add(shadowHeadMesh);

    // Sepasang Mata Merah Menyala Tajam (2 Sphere kecil MeshBasicMaterial 0xff0000)
    const redEyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeGeo = new THREE.SphereGeometry(0.022, 12, 12);

    const leftEye = new THREE.Mesh(eyeGeo, redEyeMat);
    leftEye.position.set(-0.055, 2.06, 0.165);
    entityGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, redEyeMat);
    rightEye.position.set(0.055, 2.06, 0.165);
    entityGroup.add(rightEye);

    // PointLight merah kecil (#ff0000, intensitas 1.8, distance 2.5m) tepat di posisi mata
    const eyePointLight = new THREE.PointLight(0xff0000, 1.8, 2.5, 1.6);
    eyePointLight.position.set(0, 2.06, 0.22);
    entityGroup.add(eyePointLight);

    entityGroup.userData = {
      smokeBodyGeo,
      eyePointLight,
      leftEye,
      rightEye
    };

    return entityGroup;
  }

  /**
   * Vertex Animation bergelombang halus menyerupai asap padat pada tubuh entitas
   */
  function updateShadowEntityVertices(entityGroup, elapsed) {
    if (!entityGroup || !entityGroup.visible || !entityGroup.userData.smokeBodyGeo) return;
    const geo = entityGroup.userData.smokeBodyGeo;
    const posAttr = geo.attributes.position;
    const base = geo.userData.basePositions;
    if (!base) return;

    for (let i = 0; i < posAttr.count; i++) {
      const ix = i * 3;
      const bx = base[ix];
      const by = base[ix + 1];
      const bz = base[ix + 2];

      // Gelombang asap padat halus sepanjang ketinggian siluet
      const waveX = Math.sin(by * 4.2 + elapsed * 3.4 + bz * 5.0) * 0.032;
      const waveZ = Math.cos(by * 3.8 - elapsed * 2.9 + bx * 5.0) * 0.032;

      posAttr.array[ix] = bx + waveX;
      posAttr.array[ix + 1] = by;
      posAttr.array[ix + 2] = bz + waveZ;
    }
    posAttr.needsUpdate = true;
  }

  /**
   * Data Sekuens Dialog Percakapan Radio Maya & Dhafir di Lantai 1 (Area Staf)
   * Seluruh subtitle menggunakan Bahasa Indonesia dengan durasi presisi.
   */
  const DHAFIR_MAYA_RADIO_SEQUENCE = Object.freeze([
    {
      stepId: 'a',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/dhafir_radio_first_contact.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kamu yang barusan membanting pintu tangga darurat di Lantai Dua? Ambil radionya kalau kamu masih mau keluar dari sini hidup-hidup. Panggil aku Dhafir.'"
    },
    {
      stepId: 'b',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/maya_radio_reply.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Siapa kamu?! Kamu sembunyi di mana? Sebenarnya makhluk apa yang ada di luar sana?!'"
    },
    {
      stepId: 'c',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/dhafir_radio_warning.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kecilkan suaramu. Dia bisa mendengar segalanya. Lobi utama terkunci rapat dan dia mengincar area terbuka. Ikuti arahanku lewat lorong staf.'"
    },
    {
      stepId: 'd',
      chimeSfx: 'assets/audio/sfx_radio_click_chime.mp3',
      file: 'assets/audio/maya_radio_acknowledge.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Baiklah... aku dengarkan. Beritahu saja bagaimana cara membuka pintu geser utama itu.'"
    }
  ]);

  /**
   * Data Rangkaian Dialog Radio Presisi 7 Babak di Ruang Arsip Darurat (The Panic Archive)
   * Seluruh file audio dipanggil dari assets/audio/ dan seluruh subtitle menggunakan Bahasa Indonesia.
   */
  const PANIC_ARCHIVE_RADIO_SEQUENCE = Object.freeze([
    // Babak 1: Panik & Penstabilan
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/maya_trapped_01.mp3',
      duration: 9000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Tidak, tidak, tidak! Sialan, buka! Dhafir?! Pintunya mengunci otomatis dari luar! Aku tidak bisa membukanya!'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/dhafir_calm_01.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Berhenti memukulnya, Maya. Bahumu cuma akan memar. Itu pintu kebakaran berlapis baja. Mengunci otomatis saat sub-generator me-reset.'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/maya_trapped_02.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Bagaimana bisa kamu setenang ini?! Aku terjebak di dalam kotak! Kalau makhluk itu merayap lewat ventilasi, aku tidak punya tempat lari lagi!'"
    },
    {
      chapter: 1,
      playChime: true,
      file: 'assets/audio/dhafir_calm_02.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Lihat sekelilingmu. Busa peredam suara tebal, dinding baja lapis ganda. Ruangan itu dibangun sebagai arsip darurat. Meredam semua suara dan panas tubuh. Kamu tidak terlihat di dalam sana. Tarik napas.'"
    },

    // Babak 2: Pengungkapan Agen & Proyek Blindspot
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/maya_investigate_01.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Hah... baiklah. Aku bernapas. Tapi jangan mengelak lagi. Siapa kamu sebenarnya, Dhafir? Kamu tahu denah gedung, kamu paham indra makhluk itu... siapa kamu?'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/dhafir_reveal_01.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku bertugas di bawah divisi taktis khusus. Pengintaian operasi tertutup. Dua puluh lima menit lalu, sensor kami menangkap robekan elektromagnetik besar berpusat di kompleks ini.'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/maya_investigate_02.mp3',
      duration: 9000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Robekan elektromagnetik? Sebenarnya apa yang dibuat di ruang bawah tanah ini? Senjata? Makhluk apa sebenarnya monster bermata merah menyala itu?!'"
    },
    {
      chapter: 2,
      playChime: true,
      file: 'assets/audio/dhafir_reveal_02.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Proyek Blindspot. Itu bukan alien atau hewan, Maya. Itu konstruk saraf biomekanik sintetis. Menargetkan persepsi visual manusia. Saat kamu menatap matanya, dia mengunci sinapsis sarafmu dan memburumu.'"
    },

    // Babak 3: Konspirasi & Pengkhianatan Mark
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_01.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Senjata saraf... tunggu, Mark bekerja di bidang arsitektur jaringan saraf di sini. Apa Mark tahu soal ini?! Katakan padaku dia tidak ada hubungannya dengan semua ini!'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/dhafir_mark_reveal_01.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku mengakses server keamanan utama sebelum turun ke lantai bawah. Kebocoran isolasi bukan kerusakan teknis. Segel magnetiknya dibuka manual menggunakan kartu akses utama milik Dr. Mark Evans.'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_breakdown_01.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Tidak... jangan bohong padaku! Mark yang menelepon ponselku di lantai tiga! Suaranya terdengar panik... dia menyuruhku keluar, dia bilang dia mau menyelamatkanku!'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/dhafir_mark_reveal_02.mp3',
      duration: 20000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Dengarkan aku, Maya! Makhluk itu sebelumnya tidur. Butuh pikiran manusia yang aktif dan tertekan untuk mengkalibrasi sensor berburunya sebelum pihak pembeli datang. Mark meneleponmu untuk memastikan kamu bangun, bergerak, dan memicu aktivitas otak. Kamu cuma umpan untuk menguji prototipenya.'"
    },
    {
      chapter: 3,
      playChime: true,
      file: 'assets/audio/maya_mark_breakdown_02.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Selama berbulan-bulan... dia tersenyum padaku, membuatkan kopi untukku... dan ternyata selama ini, aku cuma tikus laboratorium yang menunggu dibantai. Bagaimana bisa seseorang sejahat itu...?'"
    },

    // Babak 4: Sisi Personal & Alasan Dhafir Bertindak Sendiri
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_comfort_01.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Keserakahan mengikis kemanusiaan lebih cepat daripada peluru. Jangan buang air matamu untuk orang yang menukar nyawamu dengan uang. Kamu masih bernapas. Kamu selamat di saat seluruh regu keamanan tewas.'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/maya_personal_01.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kenapa kamu masuk sendirian, Dhafir? Kalau tim evakuasimu sedang menuju kemari, kenapa kamu tidak menunggu di luar saja bersama tim perimeter?'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_personal_02.mp3',
      duration: 22000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Protokol memang menyuruh menunggu. Prosedur standar meminta pembakaran total dengan amunisi pembakar untuk meratakan gedung. Tapi tiga tahun lalu... dalam misi di luar negeri, aku ragu, mengikuti protokol, dan meninggalkan warga sipil terjebak di balik reruntuhan. Aku bersumpah tidak akan membiarkan birokrasi mengorbankan nyawa orang tak bersalah lagi.'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/maya_personal_02.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Jadi kamu melanggar perintah... hanya karena melihat tanda panas tubuhku yang terseok-seok menembus lantai yang banjir?'"
    },
    {
      chapter: 4,
      playChime: true,
      file: 'assets/audio/dhafir_personal_03.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku mendengar seorang pejuang lewat radio. Seseorang yang merayap menembus pecahan kaca, menghindari sengatan listrik, dan menolak untuk menyerah. Kamu layak bertahan hidup, Maya. Aku di sini hanya untuk menyeimbangkan keadaan.'"
    },

    // Babak 5: Dinamika Kedekatan Emosional
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_01.mp3',
      duration: 19000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kamu tahu... seumur hidupku, orang-orang selalu bilang aku terlalu keras kepala, terlalu mandiri. Tapi berdiri di ruangan gelap ini... mendengar suaramu dari radio kecil ini... aku tidak pernah merasa seaman ini.'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/dhafir_feeling_02.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Kamu lebih tangguh dari dugaanmu. Tapi orang paling tangguh sekalipun butuh seseorang untuk menjaga titik buta mereka. Untuk itulah aku di sini.'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_03.mp3',
      duration: 15000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Saat semua ini berakhir... saat matahari terbit dan timmu tiba... apa kamu akan pergi begitu saja seperti hantu? Atau aku bisa mentraktirmu kopi yang sebenarnya tidak layak dinikmati Mark?'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/dhafir_feeling_04.mp3',
      duration: 14000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Secangkir kopi hitam di luar zona pertempuran terdengar seperti surga. Aku tidak akan menghilang meninggalkanmu, Maya. Aku akan menunggumu di posko medis. Simpan radio itu di sakumu, ya?'"
    },
    {
      chapter: 5,
      playChime: true,
      file: 'assets/audio/maya_feeling_05.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku tidak akan melepaskannya. Janji padaku kamu tidak akan terluka, Dhafir.'"
    },

    // Babak 6: Taktik Penetrasi Pintu
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/dhafir_prep_01.mp3',
      duration: 15000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Aku berjanji. Sekarang dengarkan baik-baik: Aku sudah sampai di lorong luar ruang arsipmu. Kunci elektroniknya hangus, tapi engsel hidrolik cadangannya terekspos.'"
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/maya_prep_02.mp3',
      duration: 6000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Kamu tepat di luar?! Kamu bisa memotong rangkanya?'"
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/dhafir_prep_03.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Tidak ada waktu untuk las pemotong. Aku memasang peluru penembus baja. Pindah ke sudut belakang ruangan, di balik lemari arsip tebal. Tutup kepala dan telingamu!'",
      objectiveOnStart: 'Berlindung di sudut belakang ruangan di balik lemari arsip tebal!'
    },
    {
      chapter: 6,
      playChime: true,
      file: 'assets/audio/maya_prep_04.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku sudah di posisi! Lakukan!'",
      triggerBreachAfter: true
    }
  ]);

  const PANIC_ARCHIVE_POST_BREACH_SEQUENCE = Object.freeze([
    // Babak 7: Tembakan Pintu & Dorongan Terakhir ke Lobi
    {
      chapter: 7,
      playChime: false,
      file: 'assets/audio/maya_cough_smoke.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Uhuk... uhuk... engselnya copot hancur! Dhafir?! Kamu di mana?!'"
    },
    {
      chapter: 7,
      playChime: true,
      file: 'assets/audio/dhafir_final_push.mp3',
      duration: 16000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CH-04]',
      text: "Dhafir: 'Jangan cari aku, Maya! Aku menahan titik buta belakang! Suara tembakan tadi memancing makhluk itu—dia turun dari plafon atrium! Lari menembus pintu lobi sekarang juga! Jangan lihat ke atas plafon, terus lari!'"
    },
    {
      chapter: 7,
      playChime: true,
      file: 'assets/audio/maya_final_sprint.mp3',
      duration: 10000,
      speaker: 'TRANSMISI RADIO // MAYA [CH-04]',
      text: "Maya: 'Aku lari! Sampai ketemu saat fajar terbit, Dhafir!'"
    }
  ]);

  /**
   * RANGKAIAN DIALOG SINKRON & TERSTRUKTUR: TIM TAKTIS "CODE 0" & PENEMUAN MARK DI CCTV LANTAI 2
   * Seluruh file audio dipanggil dari assets/audio/ dengan durasi presisi milidetik & klik PTT sfx_radio_click_chime.mp3.
   */
  const CODE0_SECURITY_HUB_SEQUENCE = Object.freeze([
    // Fase 2: Kejutan Kedatangan Tim "Code 0"
    {
      phase: 2,
      playChime: true,
      file: 'assets/audio/jack_surprise_entry.mp3',
      duration: 9000,
      speaker: 'TRANSMISI MILITER TERENKRIPSI // JACK [CODE 0]',
      text: "Jack: 'Tahan tembakanmu, kawan! Tim Code 0 baru saja menjebol gerbang kargo timur. Kamu pikir kami bakal membiarkanmu main solo di neraka ini, Dhafir?'",
      objectiveOnStart: 'Dengarkan transmisi frekuensi taktis Tim Code 0 di Ruang Kontrol Keamanan.',
      shadowBurst: true
    },
    {
      phase: 2,
      playChime: true,
      file: 'assets/audio/dhafir_team_react.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Jack?! Apa yang kalian lakukan di sini?! Markas memerintahkan pembakaran karantina—kalian melanggar perintah langsung!'"
    },
    {
      phase: 2,
      playChime: true,
      file: 'assets/audio/intan_code0_deploy.mp3',
      duration: 12000,
      speaker: 'TRANSMISI MILITER TERENKRIPSI // INTAN [CODE 0 - TECH]',
      text: "Intan: 'Perintah markas batal begitu suar sinyalmu terdeteksi aktif, Dhafir. Intan di sini. Aku sudah meretas terminal pintu gedung. Code 0 lengkap: aku, Jack, dan Mike sudah mengambil posisi bayangan.'",
      shadowBurst: true
    },
    {
      phase: 2,
      playChime: true,
      file: 'assets/audio/mike_vitals_scan.mp3',
      duration: 10000,
      speaker: 'TRANSMISI MILITER TERENKRIPSI // MIKE [CODE 0 - MEDIC]',
      text: "Mike: 'Mike melapor. Pemindai biometrikku menangkap detak jantung terpencar di lantai dua dan tiga. Masih ada warga sipil hidup yang terjebak di ruang servis! Kita harus evakuasi mereka!'"
    },

    // Fase 3: Komando Operasi & Maya Mengaktifkan Monitor CCTV
    {
      phase: 3,
      playChime: true,
      file: 'assets/audio/dhafir_sweep_orders.mp3',
      duration: 21000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Sialan... baiklah. Dengarkan, Code 0: Jack, tahan plafon atrium dengan amunisi berat dari mezzanine! Intan, Mike, amankan rute tangga darurat ke lantai dua lewat celah bayangan! Maya, tetap di ruang kontrol, pantau kamera pengawas, dan laporkan titik buta monster itu. Kita bawa orang-orang ini keluar hidup-hidup!'",
      objectiveOnStart: 'Pantau layar monitor CCTV di Ruang Kontrol Keamanan untuk memandu titik buta Code 0.',
      shadowBurst: true
    },
    {
      phase: 3,
      playChime: true,
      file: 'assets/audio/maya_acknowledge_cctv.mp3',
      duration: 8000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Dimengerti, Dhafir! Layar monitornya aktif. Aku awasi kalian lewat kamera pengawas... hati-hati di luar sana, kalian semua!'",
      activateCctvAfter: true
    },

    // Fase 4: Penemuan Mark Disandera & Penebusan Dosa
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/maya_spot_mark.mp3',
      duration: 11000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Tunggu... Dhafir! Lihat kamera empat di lantai dua! Pria yang tergantung di dinding pilar itu... itu Mark! Makhluk itu... melilitnya hidup-hidup!'",
      objectiveOnStart: 'Kamera 4 (Lantai 2 Atrium): Dr. Mark Evans ditemukan terlilit sulur biomekanik!'
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/dhafir_assess_mark.mp3',
      duration: 12000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Visual terkonfirmasi. Dia tidak berhasil sampai ke helipad. Ciptaannya sendiri menjadikannya inang saraf. Jack, Mike, tahan tembakan—jangan picu refleks pembunuhnya dulu!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/jack_bitter_reaction.mp3',
      duration: 9000,
      speaker: 'TRANSMISI MILITER TERENKRIPSI // JACK [CODE 0]',
      text: "Jack: 'Persetan dengan bajingan itu! Dia yang membuka kandang monster ini dan membiarkan orang-orang mati! Kenapa kita harus peduli kalau dia dimakan ciptaannya sendiri?!'",
      shadowBurst: true
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/intan_neural_warning.mp3',
      duration: 14000,
      speaker: 'TRANSMISI MILITER TERENKRIPSI // INTAN [CODE 0 - TECH]',
      text: "Intan: 'Jack, diam dan dengarkan! Makhluk itu menyedot gelombang otak Mark untuk memperluas jangkauan sensornya! Kalau Mark mati dengan kondisi saraf terkunci, monster itu akan bermutasi penuh dan gerbang gedung tidak akan pernah bisa dibuka!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/mark_plea_pain.mp3',
      duration: 14000,
      speaker: 'TRANSMISI DARURAT // DR. MARK EVANS [LANTAI 2 ATRIUM]',
      text: "Mark: 'Ugh... argh! Ma... Maya...? Suaramu... di radio...? Tolong... cabut kabel di tengkukku! Dia... dia ada di dalam kepalaku... dia membaca semua ingatanku...!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/maya_confront_mark.mp3',
      duration: 13000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Kamu tega menjadikanku umpan, Mark! Kamu meneleponku, pura-pura peduli, hanya agar monster itu bangun dan memangsaku! Sekarang lihat dirimu... kamu disandera oleh iblis yang kamu buat sendiri!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/mark_regret_confession.mp3',
      duration: 19000,
      speaker: 'TRANSMISI DARURAT // DR. MARK EVANS [LANTAI 2 ATRIUM]',
      text: "Mark: 'Aku bersalah... aku serakah, Maya! Mereka mengancam keluargaku... mereka ingin bukti prototipe ini bekerja! Tapi aku kehilangan kendali... makhluk ini punya kesadaran sendiri! Kuncinya... kode dekripsi pembatalannya... ada di drive saku jas kiriku... ambil sebelum dia menghancurkan otakku...!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/dhafir_command_rescue.mp3',
      duration: 15000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Code 0, kita ambil drive itu dan potong koneksi sarafnya! Mike, siapkan defibrilator saraf! Jack, tembak tentakel yang mengikat tangan kanannya tepat saat hitunganku dari bayangan! Maya, matikan lampu sektor dua begitu aku beri tanda—kita butakan matanya!'",
      objectiveOnStart: 'Bersiap di depan Tuas Pemutus Daya Sektor 2 pada konsol ruang kontrol!'
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/maya_ready_terminal.mp3',
      duration: 7000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Tanganku sudah di tuas pemutus daya Sektor Dua, Dhafir! Jangan sampai ada yang terluka... selamatkan dia, lalu keluar dari sana!'"
    },
    {
      phase: 4,
      playChime: true,
      file: 'assets/audio/dhafir_final_breach_call.mp3',
      duration: 6000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Tiga... dua... satu... Maya, MATIKAN LAMPUNYA! Jack, BUKA TEMBAKAN!'",
      shadowBurst: true
    }
  ]);

  /**
   * 4. RANTAI DIALOG SERBUAN PEMADAMAN LISTRIK SEKTOR 2 (CHAINED RAPID SEQUENCE)
   * Seluruh file audio dipanggil dari assets/audio/ dengan durasi milidetik presisi & Bahasa Indonesia.
   */
  const SECTOR2_BLACKOUT_ASSAULT_SEQUENCE = Object.freeze([
    {
      step: 1,
      playChime: true,
      file: 'assets/audio/maya_cut_power.mp3',
      duration: 4000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Daya padam! Lampu sektor dua mati!'"
    },
    {
      step: 2,
      playChime: true,
      file: 'assets/audio/dhafir_breach_now.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Code 0, serbu sekarang! Jack, bakar plafonnya!'",
      playHeavyFireAfter: true
    },
    {
      step: 3,
      playChime: true,
      file: 'assets/audio/jack_firing_heavy.mp3',
      duration: 4000,
      speaker: 'TRANSMISI MILITER // JACK [CODE 0 - HEAVY]',
      text: "Jack: 'Makan ini, monster sialan! Rasakan timah panas!'",
      playHeavyFireOnStart: true
    },
    {
      step: 4,
      playChime: true,
      file: 'assets/audio/mike_sever_neural.mp3',
      duration: 4000,
      speaker: 'TRANSMISI MILITER // MIKE [CODE 0 - MEDIC]',
      text: "Mike: 'Kabel sarafnya putus! Mark terjatuh ke lantai!'",
      dropMarkOnStart: true
    },
    {
      step: 5,
      playChime: true,
      file: 'assets/audio/mark_gasp_free.mp3',
      duration: 5000,
      speaker: 'TRANSMISI DARURAT // DR. MARK EVANS',
      text: "Mark: 'Uhuk... drive-nya... di saku jas kiri... ambil...!'"
    },
    {
      step: 6,
      playChime: true,
      file: 'assets/audio/dhafir_drive_secured.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Drive dekripsi diamankan. Mike, bawa Mark mundur lewat tangga darurat!'"
    },
    {
      step: 7,
      playChime: true,
      file: 'assets/audio/mike_evac_mark.mp3',
      duration: 4000,
      speaker: 'TRANSMISI MILITER // MIKE [CODE 0 - MEDIC]',
      text: "Mike: 'Dimengerti! Dia bernapas lemah, aku bawa dia keluar!'"
    },
    {
      step: 8,
      playChime: true,
      file: 'assets/audio/intan_creature_enraged.mp3',
      duration: 5000,
      speaker: 'TRANSMISI MILITER // INTAN [CODE 0 - TECH]',
      text: "Intan: 'Dhafir, monster itu mengamuk! Dia turun menuju koridor sayap barat Lantai Satu!'"
    },
    {
      step: 9,
      playChime: true,
      file: 'assets/audio/dhafir_command_maya_hub.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Maya, buka kuncimu! Kamu harus keluar dari ruang kontrol sekarang!'"
    },
    {
      step: 10,
      playChime: true,
      file: 'assets/audio/maya_ask_destination.mp3',
      duration: 4000,
      speaker: 'TRANSMISI RADIO // MAYA [SECURITY HUB]',
      text: "Maya: 'Pintunya kubuka! Tapi aku harus lari ke mana, Dhafir?!'"
    },
    {
      step: 11,
      playChime: true,
      file: 'assets/audio/dhafir_final_route.mp3',
      duration: 5000,
      speaker: 'TRANSMISI RADIO // DHAFIR [CODE 0 - LEAD]',
      text: "Dhafir: 'Lewati koridor kargo dan ruang genset! Kita bertemu di konsol gerbang utama!'"
    }
  ]);

  /**
   * 2 & 3. RANGKAIAN PAPAN ARSIP DIGITAL (512x512 PNG) & PUNCAK EMOSIONAL EPILOG
   * Seluruh foto PNG dimuat dari direktori root (./photo_*.png) dan audio dari assets/audio/.
   */
  const EPILOGUE_ARCHIVE_SEQUENCE = Object.freeze([
    {
      step: 1,
      slidePng: './photo_entity_blueprint.png',
      playProjectorClick: true,
      file: 'assets/audio/mark_reveal_monster.mp3',
      duration: 16000,
      speaker: 'DR. MARK EVANS [ARSIP KONSPIRASI]',
      text: "Mark: 'Lihat foto ini. Makhluk yang memburumu bukan kecelakaan biologis. Itu adalah senjata persepsi visual. Dirancang untuk membantai target tanpa meninggalkan jejak peluru.'"
    },
    {
      step: 2,
      slidePng: './photo_organization_apex.png',
      playProjectorClick: true,
      file: 'assets/audio/mark_reveal_org.mp3',
      duration: 13000,
      speaker: 'DR. MARK EVANS [ARSIP KONSPIRASI]',
      text: "Mark: 'Di balik proyek ini adalah Syndicate Apex. Mereka mendanai penelitianku, memeras keluargaku, dan memerintahkan pembersihan total saat sistem lepas kendali.'"
    },
    {
      step: 3,
      slidePng: './photo_code0_team.png',
      playProjectorClick: true,
      file: 'assets/audio/mark_reveal_code0.mp3',
      duration: 14000,
      speaker: 'DR. MARK EVANS [ARSIP KONSPIRASI]',
      text: "Mark: 'Dan ini... Tim Code 0. Unit operasi hitam bayangan yang paling ditakuti. Mereka tidak terdaftar di dokumen negara mana pun. Gerak mereka di bawah tanah, tak pernah meninggalkan jejak wajah.'"
    },
    {
      step: 4,
      slidePng: './photo_dhafir_dossier.png',
      playProjectorClick: true,
      file: 'assets/audio/maya_ask_dhafir_fate.mp3',
      duration: 8000,
      speaker: 'MAYA [RUANG ARSIP PERBATASAN]',
      text: "Maya: 'Lalu Dhafir... di mana dia sekarang, Mark?! Kenapa dia tidak ada di sini?! Apa dia selamat dari ledakan bom kota?!'"
    },
    {
      step: 5,
      slidePng: './photo_dhafir_dossier.png',
      playProjectorClick: false,
      startEndingBgmFadeIn: true,
      file: 'assets/audio/maya_dhafir_promise.mp3',
      duration: 15000,
      speaker: 'MAYA [MENAGIH JANJI RADIO]',
      text: "Maya: 'Dia berjanji padaku di radio... saat aku terjebak di ruang arsip, dia bilang dia tidak akan menghilang dan akan menungguku di posko medis! Aku masih ingin bicara dengannya, Mark... banyak sekali hal yang belum sempat kukatakan padanya!'"
    },
    {
      step: 6,
      slidePng: './photo_mark_evans.png',
      playProjectorClick: true,
      file: 'assets/audio/mark_comfort_reason.mp3',
      duration: 21000,
      speaker: 'DR. MARK EVANS',
      text: "Mark: 'Tarik napasmu, Maya. Dhafir tidak mengingkari janjinya karena dia tidak peduli. Dia selamat. Tapi begitu helikopter medis mendarat, satelit Apex mulai menyisir frekuensi biometrik. Jika dia menemuimu secara langsung, jejaknya akan membawamu ke garis bidik mereka. Menghilang adalah satu-satunya cara dia melindungimu dari kejaran organisasi itu.'"
    },
    {
      step: 7,
      slidePng: './photo_dhafir_dossier.png',
      playProjectorClick: false,
      startFinalDollyPan: true,
      file: 'assets/audio/maya_final_reflection.mp3',
      duration: 12000,
      speaker: 'MAYA [REFLEKSI TERAKHIR]',
      text: "Maya: 'Jadi dia memilih menjadi bayangan... agar aku bisa tetap berjalan di tempat terang. Dia benar-benar menjaga titik butaku sampai akhir. Terima kasih, Dhafir.'"
    }
  ]);

  /**
   * 1. SISTEM CHECKPOINT PRESISI (ANTI-STUCK RESPAWN SYSTEM)
   * Daftar titik aman tervalidasi bebas tabrakan (clearance >= 0.8m) dengan Vector3 & rotasi Euler.
   */
  const CHECKPOINT_DEFINITIONS = Object.freeze({
    CP_FLOOR_3_BEDROOM: {
      id: 'CP_FLOOR_3_BEDROOM',
      floor: 3,
      position: { x: 0.0, y: 1.60, z: 1.80 },
      rotation: { x: 0.0, y: 0.0, z: 0.0, order: 'YXZ' },
      yaw: 0.0,
      pitch: 0.0,
      minClearance: 0.85
    },
    CP_FLOOR_2_STAIRS: {
      id: 'CP_FLOOR_2_STAIRS',
      floor: 2,
      position: { x: 4.55, y: 1.68, z: -11.10 },
      rotation: { x: 0.0, y: Math.PI / 2, z: 0.0, order: 'YXZ' },
      yaw: Math.PI / 2,
      pitch: 0.0,
      minClearance: 0.85
    },
    CP_FLOOR_1_ARCHIVE: {
      id: 'CP_FLOOR_1_ARCHIVE',
      floor: 1,
      position: { x: 1.90, y: -2.52, z: 20.50 },
      rotation: { x: 0.0, y: Math.PI, z: 0.0, order: 'YXZ' },
      yaw: Math.PI,
      pitch: 0.0,
      minClearance: 0.90
    },
    CP_FLOOR_1_SECURITY_HUB: {
      id: 'CP_FLOOR_1_SECURITY_HUB',
      floor: 1,
      position: { x: -4.25, y: -2.52, z: 27.80 },
      rotation: { x: 0.0, y: Math.PI / 2, z: 0.0, order: 'YXZ' },
      yaw: Math.PI / 2,
      pitch: 0.0,
      minClearance: 0.90
    },
    CP_FLOOR_1_CARGO_HALL: {
      id: 'CP_FLOOR_1_CARGO_HALL',
      floor: 1,
      position: { x: -3.20, y: -2.52, z: 29.80 },
      rotation: { x: 0.0, y: Math.PI, z: 0.0, order: 'YXZ' },
      yaw: Math.PI,
      pitch: 0.0,
      minClearance: 0.85
    }
  });

  const gameState = window.gameState || {
    currentCheckpoint: 'CP_FLOOR_3_BEDROOM'
  };
  window.gameState = gameState;

  class CheckpointManager {
    constructor(gameScene, floorExpansion) {
      this.game = gameScene;
      this.expansion = floorExpansion;
      this.checkpoints = CHECKPOINT_DEFINITIONS;
      if (!gameState.currentCheckpoint || !this.checkpoints[gameState.currentCheckpoint]) {
        gameState.currentCheckpoint = 'CP_FLOOR_3_BEDROOM';
      }
    }

    setCheckpoint(checkpointId) {
      if (!this.checkpoints[checkpointId]) return false;
      gameState.currentCheckpoint = checkpointId;
      if (this.game && this.game.gameState) {
        this.game.gameState.currentCheckpoint = checkpointId;
      }
      const cp = this.checkpoints[checkpointId];
      if (this.expansion) {
        this.expansion.lastCheckpoint = {
          id: cp.id,
          x: cp.position.x,
          y: cp.position.y,
          z: cp.position.z,
          yaw: cp.yaw,
          pitch: cp.pitch
        };
      }
      return true;
    }

    getCurrentCheckpointData() {
      const id = gameState.currentCheckpoint || 'CP_FLOOR_3_BEDROOM';
      return this.checkpoints[id] || this.checkpoints.CP_FLOOR_3_BEDROOM;
    }

    /**
     * Memvalidasi bahwa koordinat spawn memiliki ruang bebas (bounding-box clearance >= 0.8m)
     * di 8 arah mata angin agar pemain tidak pernah tersangkut di dalam geometri dinding.
     */
    validateClearancePosition(cp) {
      const THREE = window.THREE;
      const basePos = { x: cp.position.x, y: cp.position.y, z: cp.position.z };
      if (!this.expansion || typeof this.expansion.isPositionWalkable !== 'function') {
        return THREE ? new THREE.Vector3(basePos.x, basePos.y, basePos.z) : basePos;
      }

      const clearanceR = 0.42; // Diameter > 0.8m
      if (this.expansion.isPositionWalkable(basePos.x, basePos.z, clearanceR)) {
        return THREE ? new THREE.Vector3(basePos.x, basePos.y, basePos.z) : basePos;
      }

      const offsets = [
        [0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4],
        [0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]
      ];
      for (let i = 0; i < offsets.length; i++) {
        const tx = basePos.x + offsets[i][0];
        const tz = basePos.z + offsets[i][1];
        if (this.expansion.isPositionWalkable(tx, tz, 0.32)) {
          return THREE ? new THREE.Vector3(tx, basePos.y, tz) : { x: tx, y: basePos.y, z: tz };
        }
      }
      return THREE ? new THREE.Vector3(basePos.x, basePos.y, basePos.z) : basePos;
    }

    /**
     * Memindahkan kamera/rig pemain ke Vector3 checkpoint aktif, me-reset kecepatan jatuh (gravity velocity = 0),
     * dan memperbarui orientasi kamera (Euler) tanpa memicu glitch collision mesh.
     */
    respawnPlayer() {
      const THREE = window.THREE;
      const cp = this.getCurrentCheckpointData();
      const safeVec = this.validateClearancePosition(cp);

      if (this.game) {
        this.game.gravityVelocity = 0;
        this.game.verticalVelocity = 0;
        this.game.walkBobTimer = 0;
        if (this.game.moveInput) {
          this.game.moveInput.forward = false;
          this.game.moveInput.backward = false;
          this.game.moveInput.left = false;
          this.game.moveInput.right = false;
        }

        if (this.game.camera) {
          const activeH = this.game.isCrouching ? (this.game.crouchHeight || 0.62) : (this.game.playerHeight || 1.6);
          const floorElev = (this.expansion && typeof this.expansion.getFloorElevationAt === 'function')
            ? this.expansion.getFloorElevationAt(safeVec.x, safeVec.z)
            : (cp.floor === 1 ? -4.2 : 0.0);
          const targetY = (cp.floor === 1 || cp.floor === 2) ? (floorElev + activeH) : cp.position.y;

          this.game.camera.position.set(safeVec.x, targetY, safeVec.z);
          this.game.yaw = cp.yaw;
          this.game.pitch = cp.pitch;

          if (THREE && THREE.Euler && typeof this.game.camera.setRotationFromEuler === 'function') {
            const euler = new THREE.Euler(cp.pitch, cp.yaw, 0, 'YXZ');
            this.game.camera.setRotationFromEuler(euler);
          } else {
            this.game.camera.rotation.x = cp.pitch;
            this.game.camera.rotation.y = cp.yaw;
            this.game.camera.rotation.z = 0;
          }
        }
      }
      return cp;
    }
  }

  window.CheckpointManager = CheckpointManager;
  window.Blindspot.CheckpointManager = CheckpointManager;
  window.Blindspot.CHECKPOINT_DEFINITIONS = CHECKPOINT_DEFINITIONS;

  class FloorThreeExpansion {
    constructor(gameScene) {
      this.game = gameScene;
      this.scene = gameScene ? gameScene.scene : null;
      if (gameScene && !Array.isArray(gameScene.interactables)) {
        gameScene.interactables = [];
      }
      this.interactables = (gameScene && gameScene.interactables) ? gameScene.interactables : [];

      // Pencahayaan Lobby & Luar Jendela
      this.lobbyNeonLight = null;
      this.lobbyNeonMat = null;
      this.lobbyEmergencyLights = [];
      this.skyFlashLight = null;
      this.skyFlashTimer = 0;
      this.nextSkyFlashIn = 4.2;
      this.elevatorErrorLight = null;
      this.elevatorButtonMat = null;
      this.elevatorSparkLight = null;

      // Mekanik Gorden Jendela Dua Tahap
      this.curtainLeft = null;
      this.curtainRight = null;
      this.areCurtainsOpen = false;
      this.isCurtainAnimating = false;
      this.curtainAnimStart = 0;
      this.curtainAnimDuration = 0.8;

      // Kamar 304 (5m x 4m) & Kunci Ruang Panel 3B (Maintenance 3B)
      this.room304DoorPivot = null;
      this.isRoom304Open = true;
      this.isRoom304TrapLocked = false;
      this.isRoom304Animating = false;
      this.room304AnimStart = 0;
      this.room304AnimDuration = 1.2;
      this.room304TargetAngle = 0.62;

      this.hasEnteredRoom304 = false;
      this.hasMaintenanceKey = false;
      this.hasStairwellKey = false;
      this.stairwellKeyMesh = null;
      this.keyGlintPoints = null;
      this.keyGlintMat = null;

      // Entitas Kamar 304 & Koridor Luar (Shadow with Glowing Red Eyes)
      this.roomEntityMesh = null;
      this.roomEntityHeadWorldPos = null;
      this.isRoom304EntityActive = false;
      this.isLookingAtRoomEntity = false;
      this.room304BlinkCount = 0;
      this.staticBuzzOsc = null;
      this.staticBuzzGain = null;

      // Event Mata Merah di Koridor Luar (Pasca Keluar Kamar 304)
      this.corridorRedEyesEntity = null;
      this.hasTriggeredCorridorRedEyes = false;
      this.isCorridorRedEyesActive = false;

      // Pintu & Interior Ruang Panel 3B (6m x 5m) + CCTV + Basement Generator (12m x 10m)
      this.maintenance3BDoorPivot = null;
      this.isMaintenance3BOpen = false;
      this.isMaintenance3BAnimating = false;
      this.maintenance3BAnimStart = 0;
      this.hasEnteredMaintenance3B = false;

      // Sistem Monitor CCTV Interaktif (3 CRT Monitors + Foreshadowing Scare)
      this.cctvCanvas = null;
      this.cctvCtx = null;
      this.cctvTex = null;
      this.isCctvInspecting = false;
      this.cctvInspectTimer = 0;
      this.hasInspectedCctv = false;
      this.savedCamBeforeCctv = null;

      // Pintu Besi "BASEMENT ACCESS - GENERATOR" & Tangga Bawah Tanah
      this.basementDoorPivot = null;
      this.isBasementDoorOpen = true;
      this.dripTimer = 0;

      // Ruang Generator Basement (12m x 10m di y = -4.4m) & Jumpscare Dash
      this.generatorGroup = null;
      this.generatorLeverPivot = null;
      this.isGeneratorRunning = false;
      this.isLeverAnimating = false;
      this.leverAnimStart = 0;
      this.isElevatorPowered = false;

      this.hasTriggeredBasementDash = false;
      this.isBasementDashAnimating = false;
      this.basementDashStart = 0;
      this.basementDashEntity = null;

      // Lampu-lampu Kuning Industri (PointLight intensitas 1.5) yang menyala bertahap
      this.industrialRecoveryLights = [];

      // Kamar 307 Door Group
      this.room307DoorGroup = null;
      this.room307ThudTimer = 0;

      // Environmental Screamers
      this.hasTriggeredElevatorDrop = false;
      this.hasTriggeredVaseDrop = false;
      this.isVaseFalling = false;
      this.vaseFallStart = 0;
      this.vaseFallDuration = 0.42;
      this.vaseMesh = null;
      this.vaseShardsGroup = null;

      // Mekanik Tatapan Fatal (Fatal Gaze Attack System)
      this.stalkerShadowEntity = null;
      this.isStalkerEntityActive = false;
      this.gazeLockTimer = 0;
      this.lastEyeLockWarningAt = 0;
      this.hasTriggeredGazeWarningInSession = false;
      this.hasPlayedStareWarningMonologue = false;
      this.isFatalAttackInProgress = false;
      this.fatalAttackTimer = 0;
      this.fatalAttackEntity = null;
      this.fatalGazeOverlayEl = null;
      this.lastCheckpoint = { x: 2.9, y: 1.68, z: -18.5, yaw: 0 };

      // Kabin Lift Utama Lantai 3 & Sekuens Anjlok ke Lantai 2 (The Stuck Lift Twist)
      this.mainElevatorLeftDoor = null;
      this.mainElevatorRightDoor = null;
      this.elevatorDoorOpenFactor = 0; // 0 = tertutup, 1 = terbuka penuh, 0.5 = terbuka paksa 50%
      this.targetElevatorDoorFactor = 0;
      this.isElevatorDoorSequenceTriggered = false;
      this.isElevatorCabinOpen = false;
      this.isInsideElevatorCabin = false;
      this.isElevatorDescending = false;
      this.isOnFloorTwo = false;
      this.cabinNeonLight = null;
      this.cabinNeonMat = null;
      this.cabinEmergencyLight = null;
      this.cabinFloorIndicatorCanvas = null;
      this.cabinFloorIndicatorCtx = null;
      this.cabinFloorIndicatorTex = null;
      this.rootScene = gameScene.scene;
      this.floorThreeRootGroup = null;
      this.floorTwoGroup = null;
      this.floorTwoWaterMesh = null;
      this.floorTwoNeonLight = null;
      this.floorTwoNeonMat = null;
      this.skylineGroup = null;

      // State Lantai 2 (The Flooded Ward — Looping Corridor, Crawl Escape, Breaker, Reflection, Padlock 7-4-2)
      this.elevatorJammedShutterMesh = null;
      this.targetElevatorShutterY = 1.12; // Saat anjlok di Lantai 2: naik sedikit menyisakan celah bawah 50 cm (center y = 1.40)
      this.hasCrawledOutOfElevator = false;
      this.hasTriggeredFloor2EnterMonologue = false;
      this.waterStepTimer = 0;

      // Rintangan Pintu Tangga Darurat Lantai 2 & Gembok Kombinasi 3 Angka (7-4-2)
      this.floor2StairDoorPivot = null;
      this.floor2ChainsGroup = null;
      this.padlockMesh = null;
      this.isChainsFalling = false;
      this.chainsFallTimer = 0;
      this.isPadlockUnlocked = false;
      this.isFloor2StairDoorOpen = false;
      this.isFloor2StairDoorAnimating = false;
      this.floor2StairDoorAnimStart = 0;
      this.isFloor2StairDoorSlammedSafe = false;

      // Rintangan Air Berlistrik (Electrified Water Hazard) & Kotak Sekring Kamar 203
      this.isFloor2BreakerOn = true;
      this.electrifiedWaterBox3 = null;
      this.sparkingCableGroup = null;
      this.electricSparkLight = null;
      this.sparkAudioLoopTimer = 0;
      this.hasPlayedSparkWarningMonologue = false;
      this.breakerSwitchMesh = null;
      this.floor2BreakerLeverPivot = null;
      this.isBreakerLeverAnimating = false;
      this.breakerLeverAnimStart = 0;

      // Petunjuk Kode Gembok (Digit 1: "7" di Kamar 203, Digit 2-3: "4 - 2" di Kamar 205)
      this.hasReadRoom201Memo = false;
      this.hasDigit7 = false;
      this.hasDigits42 = false;
      this.hasFullPadlockCode = false;

      // Sistem Pantulan Air (Water Reflection Hazard) & Pengejaran di Air (Water Dash Scare)
      this.floor2ReflectionEntity = null;
      this.waterReflectionEyesGroup = null;
      this.hasPlayedReflectionWarningMonologue = false;
      this.reflectionGraceTimer = 0;
      this.floor2ChaseEntity = null;
      this.isFloor2WaterChaseActive = false;
      this.floorTwoExitSignLights = [];
      this.floor2ExitSignLights = this.floorTwoExitSignLights;
      this.electricArcMat = null;
      this.genStatusLight = null;
      this.isCutsceneLocked = false;

      // State Lantai 1 (Ground / Koridor Staf) & Komunikasi Radio Maya-Dhafir
      this.isOnFloorOne = false;
      this.floor1StairExitDoorPivot = null;
      this.isFloor1EntryDoorOpen = false;
      this.isFloor1EntryDoorAnimating = false;
      this.floor1EntryDoorAnimStart = 0;

      this.radioHTMesh = null;
      this.radioLEDMesh = null;
      this.radioLEDMat = null;
      this.radioLEDLight = null;
      this.hasTriggeredRadioStaticCall = false;
      this.isRadioRinging = false;
      this.hasPickedUpRadioHT = false;
      this.isRadioTransmitting = false;
      this.hasCompletedDhafirRadioDialog = false;

      this.floor1DoubleDoorLeftPivot = null;
      this.floor1DoubleDoorRightPivot = null;
      this.floor1DoubleDoorLockLight = null;
      this.floor1DoubleDoorLockMat = null;
      this.isFloor1DoubleDoorUnlocked = false;
      this.isFloor1DoubleDoorAnimating = false;
      this.floor1DoubleDoorAnimStart = 0;
      this.floor1StaffNeonLights = [];
      this.floor1LobbyEntity = null;

      // State Ruang Arsip Terjebak Lantai 1 (The Panic Archive) & Pelarian Lobi Utama
      this.archiveDoorMesh = null;
      this.archiveExitDoorPivot = null;
      this.archiveExitDoorMesh = null;
      this.archiveElectronicPanelMat = null;
      this.archiveElectronicSparkLight = null;
      this.archiveHingeSparksPoints = null;
      this.archiveHingeSparksMat = null;
      this.archiveHingeSmokeGroup = null;
      this.archiveBreachFlashLight = null;
      this.hasTriggeredArchiveTrap = false;
      this.isPlayerTrappedInArchive = false;
      this.isArchiveDoorSlamAnimating = false;
      this.archiveDoorSlamStart = 0;
      this.isArchiveExitBreached = false;
      this.isArchiveBreachAnimating = false;
      this.archiveBreachAnimStart = 0;
      this.isMainLobbyUnlocked = false;
      this.hasReachedMainLobbyExit = false;

      // State Pengalihan Rute Security Hub, Tim Taktis "Code 0" (Shadow Movement), & Mark di CCTV Lantai 2
      this.hasTriggeredLobbyPillarCollapse = false;
      this.isLobbyPillarCollapsed = false;
      this.isLobbyPillarCollapsing = false;
      this.lobbyPillarCollapseStart = 0;
      this.lobbyCollapsedPillarGroup = null;
      this.lobbyCollapseDustGroup = null;

      this.securityHubDoorPivot = null;
      this.securityHubDoor = null;
      this.securityHubBoltMesh = null;
      this.isSecurityHubDoorLocked = false;
      this.isSecurityHubDoorClosing = false;
      this.securityHubDoorAnimStart = 0;
      this.hasStartedCode0Comms = false;

      // Pementasan Visual Tim "Code 0" (Shadow Planes & Muzzle Flash Point Lights - Tanpa Full 3D Character Mesh)
      this.code0ShadowSilhouettes = [];
      this.code0MuzzleFlashLights = [];
      this.code0ShadowActive = false;
      this.code0MuzzleFlashTimer = 0;

      // Konsol Monitor CCTV Tabung (Kamera 4 Lantai 2 Atrium) & Model 3D Dr. Mark Evans Disandera
      this.isCctvCam4Active = false;
      this.cctvCam4Canvas = null;
      this.cctvCam4Ctx = null;
      this.cctvCam4Texture = null;
      this.cctvCam4ScreenMat = null;
      this.cctvCam4GlowLight = null;
      this.markHostage3DGroup = null;
      this.markHostageTendrils = [];
      this.markRightArmTendrilMesh = null;

      // Tuas Pemutus Daya Sektor 2 (Sector 2 Power Cutoff Lever)
      this.isBreachCountdownFinished = false;
      this.isSector2LeverReady = false;
      this.hasPulledSector2Lever = false;
      this.isSector2LeverAnimating = false;
      this.sector2LeverAnimStart = 0;
      this.sector2BreakerMesh = null;
      this.sector2BreakerHandlePivot = null;
      this.sector2BreakerLEDMat = null;
      this.sector2BreakerGlowLight = null;

      // Sistem Checkpoint Presisi (CheckpointManager)
      this.checkpointManager = new CheckpointManager(this.game, this);

      // Animasi Halus Pintu Security Hub (0.8 detik: -Math.PI/2 -> 0 saat masuk, 0 -> +Math.PI/2 saat keluar)
      this.hasPlayerEnteredSecurityHub = false;
      this.securityHubDoorFromAngle = -Math.PI / 2;
      this.securityHubDoorToAngle = -Math.PI / 2;
      this.securityHubDoorAnimDuration = 800; // 0.8 detik
      this.canUnlockSecurityHubDoorToExit = false;
      this.isSecurityHubExitDoorOpen = false;
      this.securityHubDoorColliderBox3 = null;

      // Lampu Darurat Merah Berputar (Red Strobe Light) & Partikel Percikan Api Konsol saat Pemadaman Sektor 2
      this.isSector2BlackoutActive = false;
      this.securityHubMainLight = null;
      this.securityHubRedStrobePivot = null;
      this.securityHubRedStrobeLight = null;
      this.securityHubStrobeBeamMat = null;
      this.consoleBreakerSparksPoints = null;
      this.consoleBreakerSparksMat = null;
      this.isMarkDroppedFromPillar = false;

      // Perluasan Geometri Lantai 1: Cargo Hall, Ruang Genset (Turbin & Uap), Medical Bay, & Konsol Gerbang Utama
      this.floor1TurbineRotor = null;
      this.floor1SteamGroup = null;
      this.mainGateConsoleMesh = null;
      this.mainArmoredGateLeft = null;
      this.mainArmoredGateRight = null;
      this.isMainGateOpening = false;
      this.mainGateAnimStart = 0;

      // AI Monster Mengamuk di Koridor Sayap Barat & Kargo Lantai 1 (Fatal Gaze + Blink Active)
      this.westWingCargoEntity = null;
      this.isWestWingMonsterActive = false;
      this.westWingPatrolPhase = 0;

      // State Ekstraksi Gerbang Utama, Kendaraan Taktis Code 0, Peledakan Kota, & Kamar Rumah Sakit
      this.isBlastDoorOpening = false;
      this.isBlastDoorOpen = false;
      this.blastDoorAnimStart = 0;
      this.tacticalApcGroup = null;
      this.apcRearDoorLeftPivot = null;
      this.apcRearDoorRightPivot = null;
      this.isApcRearDoorClosing = false;
      this.apcRearDoorAnimStart = 0;
      this.apcRearWindowMat = null;
      this.apcBlastFlashLight = null;
      this.dhafirApcMesh = null;
      this.dhafirGestureArmPivot = null;
      this.jackApcMesh = null;
      this.civWomanShoulders = null;
      this.civChildGroup = null;
      this.civElderlyGroup = null;
      this.civWorkerGroup = null;
      this.apcEngineAudio = null;
      this.isWaitingToBoardApc = false;
      this.hasBoardedApc = false;
      this.isInApcCabin = false;
      this.isApcDriving = false;
      this.apcDriveTimer = 0;

      // State Kamar Rawat Rumah Sakit (The Hospital Awakening - Belum Ending)
      this.hospitalRoomGroup = null;
      this.hospitalMarkGroup = null;
      this.hospitalMarkHead = null;
      this.hospitalCurtainLeft = null;
      this.hospitalCurtainRight = null;
      this.hospitalHeartbeatAudio = null;
      this.isInHospitalBed = false;
      this.hospitalBaseYaw = -0.38;
      this.incinerationOverlayEl = null;

      // State Babak Penutup (Epilogue Medical Wing Tour, PNG Conspiracy Projector, & End Credits)
      this.isInEpilogueWalk = false;
      this.isMarkLeadingTour = false;
      this.markLeftLegPivot = null;
      this.markRightLegPivot = null;
      this.markLeftArmPivot = null;
      this.markRightArmPivot = null;
      this.medicalSlidingDoorLeft = null;
      this.medicalSlidingDoorRight = null;
      this.isMedicalSlidingDoorOpen = false;
      this.isMedicalSlidingDoorAnimating = false;
      this.medicalSlidingDoorAnimStart = 0;

      this.archiveProjectorScreenMesh = null;
      this.archiveProjectorMat = null;
      this.archiveSecondaryMarkCardMesh = null;
      this.archiveSlideTextures = {};
      this.currentArchiveSlidePng = '';
      this.hasStartedArchiveProjectorSequence = false;

      this.endingBgmAudio = null;
      this.endingBgmTargetVol = 0.0;
      this.isFinalReflectionDollyActive = false;
      this.finalDollyTimer = 0;
      this.mayaPocketRadioMesh = null;
      this.outpostDawnWindowMesh = null;
      this.hasTriggeredEndCredits = false;
      this.endCreditsOverlayEl = null;

      // Audio / Monologue Lock
      this.isActionBusy = false;
      this.activeMonologueTimer = null;
      this._ensureFatalGazeOverlayDOM();
    }

    buildExpansionMap(sharedMats) {
      const THREE = window.THREE;

      this.corridorFloorMat = new THREE.MeshStandardMaterial({
        map: sharedMats.crackedTileTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.corridorWallMat = new THREE.MeshStandardMaterial({
        map: sharedMats.mossyWallTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1
      });

      this.corridorCeilingMat = new THREE.MeshStandardMaterial({
        color: 0x222428,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      this.baseboardMat = new THREE.MeshStandardMaterial({
        map: sharedMats.woodTex,
        color: 0x2b1911,
        roughness: 0.72,
        metalness: 0.08
      });

      this.ductMetalMat = new THREE.MeshStandardMaterial({
        color: 0x3b4046,
        roughness: 0.42,
        metalness: 0.68
      });

      this.darkWoodMat = sharedMats.darkWoodMat;

      this.rootScene = this.scene;
      this.floorThreeRootGroup = new THREE.Group();
      this.rootScene.add(this.floorThreeRootGroup);

      // Arahkan penambahan mesh Lantai 3 ke dalam floorThreeRootGroup agar dapat disembunyikan
      // sepenuhnya saat kabin lift anjlok ke Lantai 2 (The Flooded Ward)
      this.scene = this.floorThreeRootGroup;

      this._buildWestWingDetailsAndPlates();
      this._buildCentralHubLobby();
      this._buildDeadCitySkylineCurtainsAndMaintenance3B();
      this._buildTwinElevatorsAndCorridorEntity();
      this._buildEastWingAndInteractiveDoors();
      this._buildRoom304Interior();
      this._buildBarricadedStairwell();
      this._buildConsoleTableAndFallingVase();
      this._buildCeilingPipesDuctsAndVents();
      this._buildEmergencyWallLights();
      this._buildBasementStairwellAndMachineRoom();

      this.scene = this.rootScene;
    }

    _createRoomNumberPlate(roomNumberStr, x, y, z, rotY) {
      const THREE = window.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#3a2e1e';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#a68956';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 120, 56);

      ctx.fillStyle = '#e8d8b5';
      ctx.font = 'bold 30px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomNumberStr, 64, 34);

      const tex = new THREE.CanvasTexture(canvas);
      const plateMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x261e12,
        emissiveMap: tex,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.78
      });

      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.018), plateMat);
      plateMesh.position.set(x, y, z);
      plateMesh.rotation.y = rotY;
      this.scene.add(plateMesh);
    }

    _addBaseboard(x, z, length, axis) {
      const THREE = window.THREE;
      const geo = axis === 'z'
        ? new THREE.BoxGeometry(0.04, 0.15, length)
        : new THREE.BoxGeometry(length, 0.15, 0.04);
      const mesh = new THREE.Mesh(geo, this.baseboardMat);
      mesh.position.set(x, 0.075, z);
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    _buildWestWingDetailsAndPlates() {
      this._addBaseboard(-1.31, -9.0, 12.1, 'z');
      this._addBaseboard(1.31, -7.6, 9.3, 'z');
      this._addBaseboard(0, -14.91, 2.8, 'x');

      this._createRoomNumberPlate('302', 0.68, 1.62, -3.09, Math.PI);
      this._createRoomNumberPlate('301', -1.31, 1.62, -5.52, Math.PI / 2);
      this._createRoomNumberPlate('303', 1.31, 1.62, -6.82, -Math.PI / 2);
    }

    _buildCentralHubLobby() {
      const THREE = window.THREE;

      const lobbyFloor = new THREE.Mesh(
        new THREE.BoxGeometry(10.3, 0.1, 8.2),
        this.corridorFloorMat
      );
      lobbyFloor.position.set(6.4, -0.05, -13.6);
      lobbyFloor.receiveShadow = true;
      this.scene.add(lobbyFloor);

      const lobbyCeiling = new THREE.Mesh(
        new THREE.BoxGeometry(10.3, 0.12, 8.2),
        this.corridorCeilingMat
      );
      lobbyCeiling.position.set(6.4, 3.26, -13.6);
      this.scene.add(lobbyCeiling);

      const westSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, 3.0),
        this.corridorWallMat
      );
      westSoffit.position.set(1.4, 3.12, -13.6);
      this.scene.add(westSoffit);

      const eastSoffit = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, 3.0),
        this.corridorWallMat
      );
      eastSoffit.position.set(11.4, 3.12, -13.6);
      this.scene.add(eastSoffit);

      const westWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      westWallSouth.position.set(1.4, 1.62, -10.9);
      westWallSouth.receiveShadow = true;
      this.scene.add(westWallSouth);

      const westWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      westWallNorth.position.set(1.4, 1.62, -16.3);
      westWallNorth.receiveShadow = true;
      this.scene.add(westWallNorth);

      const eastWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      eastWallSouth.position.set(11.4, 1.62, -10.9);
      eastWallSouth.receiveShadow = true;
      this.scene.add(eastWallSouth);

      const eastWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.25, 2.7), this.corridorWallMat);
      eastWallNorth.position.set(11.4, 1.62, -16.3);
      eastWallNorth.receiveShadow = true;
      this.scene.add(eastWallNorth);

      this._addBaseboard(6.4, -9.71, 10.0, 'x');
      this._addBaseboard(1.52, -10.9, 2.6, 'z');
      this._addBaseboard(1.52, -16.3, 2.6, 'z');
      this._addBaseboard(11.28, -10.9, 2.6, 'z');
      this._addBaseboard(11.28, -16.3, 2.6, 'z');

      const pillarGeo = new THREE.BoxGeometry(0.38, 3.25, 0.38);
      [
        [2.6, 1.62, -10.1],
        [10.2, 1.62, -10.1],
        [4.4, 1.62, -17.1],
        [10.2, 1.62, -17.1]
      ].forEach(([px, py, pz]) => {
        const pillar = new THREE.Mesh(pillarGeo, this.corridorWallMat);
        pillar.position.set(px, py, pz);
        pillar.receiveShadow = true;
        this.scene.add(pillar);
      });

      const fixtureFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.06, 0.48),
        this.ductMetalMat
      );
      fixtureFrame.position.set(6.4, 3.18, -13.6);
      this.scene.add(fixtureFrame);

      this.lobbyNeonMat = new THREE.MeshStandardMaterial({
        color: 0xfff6e5,
        emissive: 0xffeecc,
        emissiveIntensity: 0.2,
        roughness: 0.25
      });
      const neonDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 0.04, 0.38),
        this.lobbyNeonMat
      );
      neonDiffuser.position.set(6.4, 3.15, -13.6);
      this.scene.add(neonDiffuser);

      this.lobbyNeonLight = new THREE.PointLight(0xffeecc, 0.95, 13.0, 2);
      this.lobbyNeonLight.position.set(6.4, 2.95, -13.6);
      this.scene.add(this.lobbyNeonLight);
    }

    /**
     * Dinding Utara Lobi (Seberang Lift):
     * - Sisi Kiri (x = 1.4 s/d 4.4): Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY")
     *   beserta ruangan interior Maintenance 3B di baliknya.
     * - Sisi Kanan (x = 4.4 s/d 11.4): Deretan Jendela Kaca Besar, Gorden Dua Tahap, & Skyline Kota Mati.
     */
    _buildDeadCitySkylineCurtainsAndMaintenance3B() {
      const THREE = window.THREE;

      // ====================================================================
      // 1. PINTU & RUANG PANEL 3B (MAINTENANCE 3B) DI SEBERANG LIFT (x = 2.9, z = -17.6)
      // ====================================================================
      // Dinding di kiri & kanan pintu Maintenance 3B (x: 1.4..2.4 dan x: 3.4..4.4)
      const mWallLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.25, 0.22), this.corridorWallMat);
      mWallLeft.position.set(1.9, 1.62, -17.6);
      this.scene.add(mWallLeft);

      const mWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.25, 0.22), this.corridorWallMat);
      mWallRight.position.set(3.9, 1.62, -17.6);
      this.scene.add(mWallRight);

      const mWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.22), this.corridorWallMat);
      mWallHeader.position.set(2.9, 2.7, -17.6);
      this.scene.add(mWallHeader);

      // Kusen & Daun Pintu Baja Maintenance 3B
      const steelDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2c3238,
        roughness: 0.45,
        metalness: 0.78
      });

      this.maintenance3BDoorPivot = new THREE.Group();
      this.maintenance3BDoorPivot.position.set(2.42, 0, -17.58);
      this.scene.add(this.maintenance3BDoorPivot);

      const mDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.15, 0.06), steelDoorMat);
      mDoorMesh.position.set(0.48, 1.075, 0);
      mDoorMesh.castShadow = true;
      mDoorMesh.receiveShadow = true;
      mDoorMesh.userData = { interactableType: 'maintenance_3b_door' };
      this.maintenance3BDoorPivot.add(mDoorMesh);

      // Pelat Metalik "MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY" pada pintu & dinding samping
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 160;
      const sctx = signCanvas.getContext('2d');
      sctx.fillStyle = '#181c20';
      sctx.fillRect(0, 0, 512, 160);
      sctx.strokeStyle = '#b91c1c';
      sctx.lineWidth = 8;
      sctx.strokeRect(8, 8, 496, 144);
      sctx.fillStyle = '#f8fafc';
      sctx.font = 'bold 34px "Share Tech Mono", monospace';
      sctx.textAlign = 'center';
      sctx.fillText('MAINTENANCE 3B', 256, 68);
      sctx.fillStyle = '#f87171';
      sctx.font = 'bold 22px "Share Tech Mono", monospace';
      sctx.fillText('AUTHORIZED PERSONNEL ONLY', 256, 114);

      const signTex = new THREE.CanvasTexture(signCanvas);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: 0x2a0808,
        emissiveMap: signTex,
        emissiveIntensity: 0.6,
        roughness: 0.35,
        metalness: 0.7
      });

      const doorSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.015), signMat);
      doorSignMesh.position.set(0.48, 1.48, 0.035);
      doorSignMesh.userData = { interactableType: 'maintenance_3b_door' };
      this.maintenance3BDoorPivot.add(doorSignMesh);

      this.interactables.push(mDoorMesh, doorSignMesh);

      // ====================================================================
      // INTERIOR RUANG PANEL 3B (MAINTENANCE & SECURITY ROOM — 6m x 5m)
      // Koordinat: x dari -0.1 s/d +5.9 (6.0m), z dari -17.6 s/d -22.6 (5.0m)
      // ====================================================================
      const mFloor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 5.2), this.corridorFloorMat);
      mFloor.position.set(2.9, -0.05, -20.1);
      mFloor.receiveShadow = true;
      this.scene.add(mFloor);

      const mCeil = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.1, 5.2), this.corridorCeilingMat);
      mCeil.position.set(2.9, 3.1, -20.1);
      this.scene.add(mCeil);

      // Dinding Kiri (x = -0.1), Kanan (x = +5.9), & Depan-Kiri (z = -17.6, x = -0.1..1.4)
      const mLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.15, 5.2), this.corridorWallMat);
      mLeftWall.position.set(-0.1, 1.55, -20.1);
      mLeftWall.receiveShadow = true;
      this.scene.add(mLeftWall);

      const mRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.15, 5.2), this.corridorWallMat);
      mRightWall.position.set(5.9, 1.55, -20.1);
      mRightWall.receiveShadow = true;
      this.scene.add(mRightWall);

      const mFrontExtWall = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.15, 0.18), this.corridorWallMat);
      mFrontExtWall.position.set(0.65, 1.55, -17.6);
      this.scene.add(mFrontExtWall);

      // Dinding Belakang (z = -22.6) dengan Bukaan Lebar Penuh (x = 3.0 s/d 4.8, lebar 1.8m)
      // agar akses turun ke Tangga Basement terbuka 100% tanpa balok penghalang!
      const mBackWallLeft = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.15, 0.18), this.corridorWallMat);
      mBackWallLeft.position.set(1.45, 1.55, -22.6);
      mBackWallLeft.receiveShadow = true;
      this.scene.add(mBackWallLeft);

      const mBackWallRight = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.15, 0.18), this.corridorWallMat);
      mBackWallRight.position.set(5.35, 1.55, -22.6);
      mBackWallRight.receiveShadow = true;
      this.scene.add(mBackWallRight);

      const mBackWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.78, 0.18), this.corridorWallMat);
      mBackWallHeader.position.set(3.9, 2.72, -22.6);
      this.scene.add(mBackWallHeader);

      // Meja Kerja Keamanan (x = 1.25, z = -21.2) dengan 3 Unit Monitor Tabung CCTV Jadul
      const secDesk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.78, 0.82), this.darkWoodMat);
      secDesk.position.set(1.25, 0.39, -21.2);
      secDesk.castShadow = true;
      secDesk.receiveShadow = true;
      this.scene.add(secDesk);

      // Buat CanvasTexture Dinamis untuk Layar Hijau Fosfor CRT CCTV (Scanline/Noise + Penampakan)
      this.cctvCanvas = document.createElement('canvas');
      this.cctvCanvas.width = 256;
      this.cctvCanvas.height = 192;
      this.cctvCtx = this.cctvCanvas.getContext('2d');
      this.cctvTex = new THREE.CanvasTexture(this.cctvCanvas);

      const cctvScreenMat = new THREE.MeshBasicMaterial({
        map: this.cctvTex
      });
      const crtCasingMat = new THREE.MeshStandardMaterial({
        color: 0x222629,
        roughness: 0.65,
        metalness: 0.35
      });

      // 3 Unit Monitor Tabung CCTV di atas meja keamanan
      [-0.62, 0, 0.62].forEach((offsetX, idx) => {
        const monGroup = new THREE.Group();
        monGroup.position.set(1.25 + offsetX, 1.05, -21.2);
        monGroup.rotation.y = (idx === 0) ? 0.22 : (idx === 2) ? -0.22 : 0;

        const casing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.46), crtCasingMat);
        casing.castShadow = true;
        casing.userData = { interactableType: 'cctv_monitor' };
        monGroup.add(casing);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), cctvScreenMat);
        screen.position.set(0, 0.01, 0.235);
        screen.userData = { interactableType: 'cctv_monitor' };
        monGroup.add(screen);

        this.scene.add(monGroup);
        this.interactables.push(casing, screen);
      });

      // Cahaya hijau fosfor redup dari ketiga layar monitor CCTV
      const cctvGlowLight = new THREE.PointLight(0x33dd66, 0.75, 4.5, 2);
      cctvGlowLight.position.set(1.25, 1.25, -20.6);
      this.scene.add(cctvGlowLight);

      // Rak Perkakas Besi (x = 5.25, z = -19.8) & Papan Gantungan Kunci Kosong
      const toolRack = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.95, 1.4), this.ductMetalMat);
      toolRack.position.set(5.35, 0.975, -19.8);
      toolRack.castShadow = true;
      this.scene.add(toolRack);

      const emptyKeyBoard = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.04), this.darkWoodMat);
      emptyKeyBoard.position.set(1.25, 1.72, -22.48);
      this.scene.add(emptyKeyBoard);

      // Lampu Ruangan Maintenance 3B
      const mRoomLight = new THREE.PointLight(0xffaa55, 0.65, 8.5, 2);
      mRoomLight.position.set(2.9, 2.8, -20.1);
      this.scene.add(mRoomLight);
      this.industrialRecoveryLights.push({ light: mRoomLight, targetIntensity: 1.5 });

      // ====================================================================
      // 2. JENDELA KACA BESAR & GORDEN INTERAKTIF (x = 4.4 s/d 11.4, z = -17.6)
      // ====================================================================
      const winBottomWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.78, 0.22), this.corridorWallMat);
      winBottomWall.position.set(7.9, 0.39, -17.6);
      winBottomWall.receiveShadow = true;
      this.scene.add(winBottomWall);

      const winTopWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.48, 0.22), this.corridorWallMat);
      winTopWall.position.set(7.9, 2.98, -17.6);
      this.scene.add(winTopWall);

      const windowSill = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.32), this.baseboardMat);
      windowSill.position.set(7.9, 0.79, -17.52);
      this.scene.add(windowSill);

      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x16191d,
        roughness: 0.45,
        metalness: 0.82
      });

      for (let x = 4.6; x <= 11.2; x += 1.65) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.02, 0.24), ironMat);
        mullion.position.set(x, 1.78, -17.6);
        this.scene.add(mullion);
      }

      const horizBar = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.24), ironMat);
      horizBar.position.set(7.9, 1.78, -17.6);
      this.scene.add(horizBar);

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x101c29,
        transparent: true,
        opacity: 0.26,
        roughness: 0.1,
        metalness: 0.88
      });
      const windowGlassMesh = new THREE.Mesh(new THREE.BoxGeometry(6.7, 1.98, 0.04), glassMat);
      windowGlassMesh.position.set(7.9, 1.78, -17.6);
      windowGlassMesh.userData = { interactableType: 'lobby_window' };
      this.scene.add(windowGlassMesh);
      this.interactables.push(windowGlassMesh);

      const curtainRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 6.8, 12),
        ironMat
      );
      curtainRod.rotation.z = Math.PI / 2;
      curtainRod.position.set(7.9, 2.84, -17.34);
      this.scene.add(curtainRod);

      const curtainFabricMat = new THREE.MeshStandardMaterial({
        color: 0x2c1618,
        roughness: 0.92,
        metalness: 0.04,
        side: THREE.DoubleSide
      });

      this.curtainLeft = this._createPleatedCurtainMesh(3.35, 2.25, curtainFabricMat);
      this.curtainLeft.position.set(6.22, 1.71, -17.36);
      this.scene.add(this.curtainLeft);

      this.curtainRight = this._createPleatedCurtainMesh(3.35, 2.25, curtainFabricMat);
      this.curtainRight.position.set(9.58, 1.71, -17.36);
      this.scene.add(this.curtainRight);

      // Skyline Kota Mati Total di Luar Jendela (Ditempatkan dalam grup terpisah di luar jalur
      // tangga basement x >= 6.8 dan y >= 0.25 sehingga TIDAK PERNAH menyumbat lubang tangga!)
      this.skylineGroup = new THREE.Group();
      this.scene.add(this.skylineGroup);

      const nightSkyBackdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(52, 22),
        new THREE.MeshBasicMaterial({ color: 0x0b1018, fog: false })
      );
      nightSkyBackdrop.position.set(11.5, 11.2, -52.0);
      this.skylineGroup.add(nightSkyBackdrop);

      const horizonMist = new THREE.Mesh(
        new THREE.PlaneGeometry(52, 6.5),
        new THREE.MeshBasicMaterial({
          color: 0x131b26,
          transparent: true,
          opacity: 0.55,
          fog: false
        })
      );
      horizonMist.position.set(11.5, 3.5, -50.5);
      this.skylineGroup.add(horizonMist);

      const blackoutBuildingMat = new THREE.MeshStandardMaterial({
        color: 0x161920,
        roughness: 0.95,
        metalness: 0.08
      });

      const skylineBuildings = [
        { x: 7.4,  z: -28.0, w: 3.2, h: 14.5, d: 3.2 },
        { x: 11.2, z: -31.0, w: 4.2, h: 21.0, d: 4.0 },
        { x: 15.6, z: -27.5, w: 3.8, h: 16.5, d: 3.8 },
        { x: 20.2, z: -33.0, w: 5.0, h: 24.0, d: 4.6 }
      ];

      skylineBuildings.forEach((b) => {
        const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), blackoutBuildingMat);
        // Bagian bawah gedung berada di y = 0.25 (tidak pernah menembus ke bawah lantai 3 / tangga basement)
        bMesh.position.set(b.x, b.h * 0.5 + 0.25, b.z);
        this.skylineGroup.add(bMesh);
      });

      this.skyFlashLight = new THREE.PointLight(0x5b7ea2, 0.14, 48, 1.1);
      this.skyFlashLight.position.set(7.9, 9.5, -24.0);
      this.scene.add(this.skyFlashLight);
    }

    _createPleatedCurtainMesh(width, height, material) {
      const THREE = window.THREE;
      const group = new THREE.Group();

      const basePanel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.04), material);
      basePanel.castShadow = true;
      basePanel.receiveShadow = true;
      basePanel.userData = { interactableType: 'lobby_window' };
      group.add(basePanel);
      this.interactables.push(basePanel);

      const pleatCount = 7;
      for (let i = 0; i < pleatCount; i++) {
        const px = -width * 0.46 + (i / (pleatCount - 1)) * (width * 0.92);
        const pleat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.055, height, 8),
          material
        );
        pleat.position.set(px, 0, 0.025);
        pleat.castShadow = true;
        pleat.userData = { interactableType: 'lobby_window' };
        group.add(pleat);
        this.interactables.push(pleat);
      }

      return group;
    }

    _buildTwinElevatorsAndCorridorEntity() {
      const THREE = window.THREE;

      // Dinding Selatan Lobi (z = -9.6) dengan Bukaan Penuh pada Lift Kanan (x = 7.15 s/d 8.65)
      // agar pemain dapat melangkah masuk ke dalam Kabin Lift Utama saat pintunya terbuka!
      const southWallLeft = new THREE.Mesh(
        new THREE.BoxGeometry(5.85, 3.25, 0.22),
        this.corridorWallMat
      );
      southWallLeft.position.set(4.225, 1.62, -9.6);
      southWallLeft.receiveShadow = true;
      this.scene.add(southWallLeft);

      const southWallRight = new THREE.Mesh(
        new THREE.BoxGeometry(2.85, 3.25, 0.22),
        this.corridorWallMat
      );
      southWallRight.position.set(10.075, 1.62, -9.6);
      southWallRight.receiveShadow = true;
      this.scene.add(southWallRight);

      const southWallElevHeader = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.95, 0.22),
        this.corridorWallMat
      );
      southWallElevHeader.position.set(7.9, 2.76, -9.6);
      this.scene.add(southWallElevHeader);

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x363b42,
        roughness: 0.38,
        metalness: 0.78
      });

      const shaftVoidMat = new THREE.MeshBasicMaterial({ color: 0x121418 });
      const cableMat = new THREE.MeshStandardMaterial({
        color: 0x1f2326,
        roughness: 0.55,
        metalness: 0.85
      });

      [4.9, 7.9].forEach((elevX, idx) => {
        const elevGroup = new THREE.Group();
        elevGroup.position.set(elevX, 0, -9.7);

        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.14, 0.2), steelMat);
        topFrame.position.set(0, 2.28, 0);
        elevGroup.add(topFrame);

        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 0.2), steelMat);
        leftFrame.position.set(-0.7, 1.175, 0);
        elevGroup.add(leftFrame);

        const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 0.2), steelMat);
        rightFrame.position.set(0.7, 1.175, 0);
        elevGroup.add(rightFrame);

        if (idx === 0) {
          // Lift Kiri (x = 4.9): Shaft gelap dengan celah kabel
          const shaftVoid = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.24, 0.48), shaftVoidMat);
          shaftVoid.position.set(0, 1.12, 0.22);
          elevGroup.add(shaftVoid);

          const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 2.2, 8), cableMat);
          cable.position.set(0, 1.12, 0.12);
          elevGroup.add(cable);
        }

        const doorLeafGeo = new THREE.BoxGeometry(0.64, 2.2, 0.06);
        const leftLeaf = new THREE.Mesh(doorLeafGeo, steelMat);
        leftLeaf.position.set(idx === 0 ? -0.34 : -0.32, 1.1, -0.02);
        leftLeaf.castShadow = true;
        leftLeaf.userData = { interactableType: 'elevator' };
        elevGroup.add(leftLeaf);

        const rightLeaf = new THREE.Mesh(doorLeafGeo, steelMat);
        rightLeaf.position.set(idx === 0 ? 0.34 : 0.32, 1.1, -0.02);
        rightLeaf.castShadow = true;
        rightLeaf.userData = { interactableType: 'elevator' };
        elevGroup.add(rightLeaf);

        if (idx === 1) {
          this.mainElevatorLeftDoor = leftLeaf;
          this.mainElevatorRightDoor = rightLeaf;
        }

        this.scene.add(elevGroup);
        this.interactables.push(leftLeaf, rightLeaf);
      });

      // ====================================================================
      // KABIN LIFT UTAMA INTERAKTIF (di belakang pintu lift kanan: x = 7.9, z = -9.6 s/d -7.6)
      // ====================================================================
      const cabinWallMat = new THREE.MeshStandardMaterial({
        color: 0x2d333b,
        roughness: 0.42,
        metalness: 0.68
      });
      const cabinFloorMat = new THREE.MeshStandardMaterial({
        color: 0x1e2228,
        roughness: 0.65,
        metalness: 0.25
      });

      const cabinGroup = new THREE.Group();
      cabinGroup.position.set(7.9, 0, -8.6);
      (this.rootScene || this.scene).add(cabinGroup);

      // Kusen & Panel Pintu Atas Lift yang Macet Setinggi 50 cm saat Anjlok di Lantai 2
      const jammedDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2f353d,
        roughness: 0.42,
        metalness: 0.78
      });
      this.elevatorJammedShutterMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.38, 1.76, 0.08),
        jammedDoorMat
      );
      // Saat terangkat sebagian di Lantai 2 (y = 1.40), bagian bawahnya berada di y = 0.52m (celah merayap 50 cm!)
      this.elevatorJammedShutterMesh.position.set(7.9, 1.40, -9.68);
      this.elevatorJammedShutterMesh.visible = false;
      (this.rootScene || this.scene).add(this.elevatorJammedShutterMesh);

      const cFloor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 2.1), cabinFloorMat);
      cFloor.position.set(0, -0.05, 0);
      cabinGroup.add(cFloor);

      const cCeil = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 2.1), cabinWallMat);
      cCeil.position.set(0, 2.42, 0);
      cabinGroup.add(cCeil);

      const cBackWall = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.45, 0.12), cabinWallMat);
      cBackWall.position.set(0, 1.2, 1.02);
      cabinGroup.add(cBackWall);

      const cLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.45, 2.1), cabinWallMat);
      cLeftWall.position.set(-0.92, 1.2, 0);
      cabinGroup.add(cLeftWall);

      const cRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.45, 2.1), cabinWallMat);
      cRightWall.position.set(0.92, 1.2, 0);
      cabinGroup.add(cRightWall);

      // Pegangan Tangan Besi (Handrail) di dalam Kabin Lift
      const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.6, 10), steelMat);
      handrail.rotation.z = Math.PI / 2;
      handrail.position.set(0, 0.92, 0.92);
      cabinGroup.add(handrail);

      // Lampu Neon Plafon Kabin Lift & Lampu Darurat Merah (untuk sekuens Lift Anjlok)
      this.cabinNeonMat = new THREE.MeshStandardMaterial({
        color: 0xfff5d6,
        emissive: 0xffe8a3,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });
      const cNeonPanel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 0.55), this.cabinNeonMat);
      cNeonPanel.position.set(0, 2.35, 0);
      cabinGroup.add(cNeonPanel);

      this.cabinNeonLight = new THREE.PointLight(0xffe8a3, 1.2, 4.5, 2);
      this.cabinNeonLight.position.set(7.9, 2.22, -8.6);
      (this.rootScene || this.scene).add(this.cabinNeonLight);

      this.cabinEmergencyLight = new THREE.PointLight(0xcc1111, 0.0, 5.0, 1.8);
      this.cabinEmergencyLight.position.set(7.9, 2.2, -8.6);
      (this.rootScene || this.scene).add(this.cabinEmergencyLight);

      // Panel Tombol Lantai Dasar [E] di Dalam Kabin Lift (di dinding samping dekat pintu)
      const innerPanelBox = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.24), steelMat);
      innerPanelBox.position.set(-0.84, 1.25, -0.52);
      innerPanelBox.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(innerPanelBox);

      const floorOneBtnMat = new THREE.MeshBasicMaterial({ color: 0xb8ff3b });
      const floorOneBtn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.09), floorOneBtnMat);
      floorOneBtn.position.set(-0.82, 1.18, -0.52);
      floorOneBtn.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(floorOneBtn);

      const innerPanelHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.1, 0.75),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      innerPanelHitbox.position.set(-0.68, 1.25, -0.52);
      innerPanelHitbox.userData = { interactableType: 'elevator_cabin_panel' };
      cabinGroup.add(innerPanelHitbox);

      // Layar Indikator Lantai Kabin ("3" -> "2")
      this.cabinFloorIndicatorCanvas = document.createElement('canvas');
      this.cabinFloorIndicatorCanvas.width = 128;
      this.cabinFloorIndicatorCanvas.height = 64;
      this.cabinFloorIndicatorCtx = this.cabinFloorIndicatorCanvas.getContext('2d');
      this.cabinFloorIndicatorTex = new THREE.CanvasTexture(this.cabinFloorIndicatorCanvas);
      this._updateCabinFloorDisplay('3', '#a3e635');

      const floorDispMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.22, 0.11),
        new THREE.MeshBasicMaterial({ map: this.cabinFloorIndicatorTex })
      );
      floorDispMesh.rotation.y = Math.PI / 2;
      floorDispMesh.position.set(-0.805, 1.41, -0.52);
      cabinGroup.add(floorDispMesh);

      this.interactables.push(innerPanelBox, floorOneBtn, innerPanelHitbox);

      // Panel Panggil Lift Luar di antara 2 unit lift (x = 6.4, z = -9.8)
      const callPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.05), steelMat);
      callPanel.position.set(6.4, 1.22, -9.8);
      callPanel.userData = { interactableType: 'elevator' };
      this.scene.add(callPanel);

      this.elevatorButtonMat = new THREE.MeshBasicMaterial({ color: 0xff1a1a });
      const errorBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.085, 0.06), this.elevatorButtonMat);
      errorBtnMesh.position.set(6.4, 1.24, -9.81);
      errorBtnMesh.userData = { interactableType: 'elevator' };
      this.scene.add(errorBtnMesh);

      const elevHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(3.4, 2.25, 0.42),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      elevHitbox.position.set(6.4, 1.12, -9.88);
      elevHitbox.userData = { interactableType: 'elevator' };
      this.scene.add(elevHitbox);
      this.interactables.push(callPanel, errorBtnMesh, elevHitbox);

      this.elevatorErrorLight = new THREE.PointLight(0xff1a1a, 0.55, 4.5, 2);
      this.elevatorErrorLight.position.set(6.4, 1.24, -9.98);
      this.scene.add(this.elevatorErrorLight);

      this.elevatorSparkLight = new THREE.PointLight(0x88ddff, 0, 5.0, 1.4);
      this.elevatorSparkLight.position.set(6.4, 1.28, -9.98);
      this.scene.add(this.elevatorSparkLight);

      // Entitas Mata Merah di Koridor Luar dekat Pintu Lift (muncul saat keluar Kamar 304)
      this.corridorRedEyesEntity = createShadowRedEyesEntity(THREE);
      this.corridorRedEyesEntity.position.set(6.4, 0, -11.2);
      this.corridorRedEyesEntity.visible = false;
      this.scene.add(this.corridorRedEyesEntity);

      // Entitas Pengintai Aktif (Stalker Entity) untuk Mekanik Tatapan Fatal (Fatal Gaze)
      this.stalkerShadowEntity = createShadowRedEyesEntity(THREE);
      this.stalkerShadowEntity.position.set(3.9, 0, -19.2);
      this.stalkerShadowEntity.visible = false;
      this.scene.add(this.stalkerShadowEntity);

      // Bangun Visual Koridor Lantai 2 (Tergenang Air Setinggi Mata Kaki & Berantakan)
      // yang akan tampak saat lift anjlok dan pintunya terbuka paksa 50%!
      this._buildFloorTwoFloodedCorridor();
    }

    _updateCabinFloorDisplay(floorText, colorHex) {
      if (!this.cabinFloorIndicatorCtx || !this.cabinFloorIndicatorTex) return;
      const ctx = this.cabinFloorIndicatorCtx;
      ctx.fillStyle = '#090d11';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 124, 60);
      ctx.fillStyle = colorHex || '#a3e635';
      ctx.font = 'bold 38px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FL ' + floorText, 64, 34);
      this.cabinFloorIndicatorTex.needsUpdate = true;
    }

    /**
     * Membangun Visual Lorong Lantai 2 (Berantakan, Tergenang Air Setinggi Mata Kaki,
     * & Lampu Neon Korsleting) yang muncul di balik pintu lift yang terbuka 50% pasca-anjlok!
     */
    _buildFloorTwoFloodedCorridor() {
      const THREE = window.THREE;
      const targetRoot = this.rootScene || this.scene;

      this.floorTwoGroup = new THREE.Group();
      this.floorTwoGroup.visible = false;
      targetRoot.add(this.floorTwoGroup);

      // Material Dinding & Plafon Lantai 2 (Rona Hijau Lumut Kusam / Karat Basah)
      const f2WallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1b2620,
        roughness: 0.78,
        metalness: 0.12
      });
      const f2CeilMat = new THREE.MeshStandardMaterial({
        color: 0x121815,
        roughness: 0.82,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const f2SubFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x09110d,
        roughness: 0.65,
        metalness: 0.2
      });

      // 1. MATERIAL GENANGAN AIR SETINGGI MATA KAKI (roughness: 0.15, metalness: 0.35, #0a1410)
      const floodWaterMat = new THREE.MeshStandardMaterial({
        color: 0x0a1410,
        roughness: 0.15,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88
      });

      // Lantai Dasar & Permukaan Air Setinggi Mata Kaki (y = 0.08m) Mencakup Koridor Lantai 2 (z <= -9.7)
      const f2BaseFloor = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.1, 20.0), f2SubFloorMat);
      f2BaseFloor.position.set(11.0, -0.05, -19.7);
      f2BaseFloor.receiveShadow = true;
      this.floorTwoGroup.add(f2BaseFloor);

      this.floorTwoWaterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(25.5, 19.8, 32, 32),
        floodWaterMat
      );
      this.floorTwoWaterMesh.rotation.x = -Math.PI / 2;
      this.floorTwoWaterMesh.position.set(11.0, 0.08, -19.7);
      this.floorTwoWaterMesh.receiveShadow = true;
      this.floorTwoGroup.add(this.floorTwoWaterMesh);

      const f2Ceiling = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.12, 24.0), f2CeilMat);
      f2Ceiling.position.set(11.0, 3.06, -19.5);
      this.floorTwoGroup.add(f2Ceiling);

      // Helper pembuat segmen dinding Lantai 2
      const addF2Wall = (w, h, d, x, y, z, mat = f2WallMat) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        this.floorTwoGroup.add(m);
        return m;
      };

      // Helper pembuat Penunjuk Arah Darurat Hijau (Emergency Exit Signs: #22c55e, intensitas 1.2)
      const addEmergencyExitSign = (x, y, z, rotY, labelText = 'EXIT // DARURAT') => {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 96;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#062e16';
        ctx.fillRect(0, 0, 256, 96);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 244, 84);
        ctx.fillStyle = '#bbf7d0';
        ctx.font = 'bold 26px "Share Tech Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, 128, 48);

        const tex = new THREE.CanvasTexture(c);
        const signMat = new THREE.MeshStandardMaterial({
          map: tex,
          emissive: 0x22c55e,
          emissiveMap: tex,
          emissiveIntensity: 1.1,
          roughness: 0.25
        });
        const signMesh = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.05), signMat);
        signMesh.position.set(x, y, z);
        signMesh.rotation.y = rotY;
        this.floorTwoGroup.add(signMesh);

        const exitLight = new THREE.PointLight(0x22c55e, 1.2, 7.5, 1.8);
        exitLight.position.set(
          x + Math.sin(rotY) * 0.25,
          y - 0.08,
          z + Math.cos(rotY) * 0.25
        );
        this.floorTwoGroup.add(exitLight);
        if (!Array.isArray(this.floorTwoExitSignLights)) {
          this.floorTwoExitSignLights = [];
          this.floor2ExitSignLights = this.floorTwoExitSignLights;
        }
        this.floorTwoExitSignLights.push({ light: exitLight, mat: signMat, phase: Math.random() * 10 });
      };

      // ====================================================================
      // A. TATA RUANG PERSEGI MELINGKAR (LOOPING CORRIDOR LANTAI 2)
      // - Koridor Selatan: x = 4.0 s/d 20.0, z = -9.7 s/d -12.5
      // - Koridor Barat:   x = 4.0 s/d 6.8,  z = -12.5 s/d -24.5
      // - Koridor Timur:   x = 17.2 s/d 20.0, z = -12.5 s/d -24.5
      // - Koridor Utara:   x = 4.0 s/d 20.0, z = -21.7 s/d -24.5
      // - Pulau Tengah (Central Core Block): x = 6.8 s/d 17.2, z = -12.5 s/d -21.7
      // ====================================================================
      // Dinding Selatan Koridor Selatan (z = -9.7) dengan bukaan kabin lift di x = 7.15 s/d 8.65
      addF2Wall(3.15, 3.1, 0.22, 5.575, 1.55, -9.7);
      addF2Wall(11.35, 3.1, 0.22, 14.325, 1.55, -9.7);
      addF2Wall(1.5, 0.85, 0.22, 7.9, 2.68, -9.7);

      // Pulau Tengah (Central Core Block: x = 6.8..17.2, z = -12.5..-21.7)
      addF2Wall(10.4, 3.1, 0.22, 12.0, 1.55, -12.5); // Sisi Selatan pulau tengah
      addF2Wall(10.4, 3.1, 0.22, 12.0, 1.55, -21.7); // Sisi Utara pulau tengah
      addF2Wall(0.22, 3.1, 9.2, 6.8, 1.55, -17.1);   // Sisi Barat pulau tengah
      addF2Wall(0.22, 3.1, 9.2, 17.2, 1.55, -17.1);  // Sisi Timur pulau tengah

      // Dinding Luar Timur Koridor Pintas (x = 20.0, z = -9.7 s/d -24.5)
      addF2Wall(0.22, 3.1, 14.8, 20.0, 1.55, -17.1);

      // Dinding Luar Utara Koridor Utara (z = -24.5, x = 4.0 s/d 17.8, dengan pintu Kamar 205 di x = 18.0..19.2)
      addF2Wall(14.0, 3.1, 0.22, 11.0, 1.55, -24.5);
      addF2Wall(0.8, 3.1, 0.22, 19.6, 1.55, -24.5);
      addF2Wall(1.2, 0.85, 0.22, 18.6, 2.68, -24.5);

      // Pasang Emergency Exit Signs Hijau (#22c55e, intensitas 1.2) di titik-titik sudut lorong
      addEmergencyExitSign(4.15, 2.45, -11.1, Math.PI / 2, '<< EXIT STAIRS');
      addEmergencyExitSign(5.4, 2.45, -12.35, 0, 'WARD 201-203');
      addEmergencyExitSign(18.6, 2.45, -12.35, 0, 'SERVICE 205 >>');
      addEmergencyExitSign(5.4, 2.45, -24.35, 0, 'STORAGE 205 >>');
      addEmergencyExitSign(18.6, 2.45, -24.35, 0, 'ROOM 205');

      // Plafon Ambruk (Collapsed Ceiling Slabs) di Beberapa Titik Lorong
      const debrisMat = new THREE.MeshStandardMaterial({
        color: 0x222924,
        roughness: 0.85,
        metalness: 0.15
      });
      [
        [10.2, 2.55, -11.1, 0.42, 0.15, -0.35],
        [10.5, 0.12, -11.4, 0.08, 0.5, 0.04],
        [5.4, 2.62, -19.2, -0.38, 0.1, 0.28],
        [9.8, 0.11, -23.1, 0.04, -0.4, 0.06]
      ].forEach(([dx, dy, dz, rx, ry, rz]) => {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.95), debrisMat);
        slab.position.set(dx, dy, dz);
        slab.rotation.set(rx, ry, rz);
        this.floorTwoGroup.add(slab);
      });

      // ====================================================================
      // B. PINTU TANGGA DARURAT LANTAI 2, RANTAI BESI & GEMBOK 3 ANGKA (x = 4.0, z = -11.1)
      // ====================================================================
      // Dinding Barat Koridor Selatan di sekitar Pintu Tangga Darurat (x = 4.0, z = -9.7..-12.5)
      addF2Wall(0.22, 3.1, 0.8, 4.0, 1.55, -10.1);
      addF2Wall(0.22, 3.1, 0.8, 4.0, 1.55, -12.1);
      addF2Wall(0.22, 0.85, 1.2, 4.0, 2.68, -11.1);

      // Ruang Bordes Tangga Darurat Lantai 2 di balik pintu (x = 0.8 s/d 4.0, z = -9.7 s/d -12.5)
      // Dinding Selatan (z = -9.7) memiliki bukaan lebar (x = 1.0..2.8) untuk Tangga Turun ke Lantai 1!
      addF2Wall(0.2, 3.1, 0.22, 0.9, 1.55, -9.7);
      addF2Wall(1.2, 3.1, 0.22, 3.4, 1.55, -9.7);
      addF2Wall(1.8, 0.75, 0.22, 1.9, 2.72, -9.7);
      addF2Wall(3.2, 3.1, 0.22, 2.4, 1.55, -12.5);
      addF2Wall(0.22, 3.1, 2.8, 0.8, 1.55, -11.1);
      addEmergencyExitSign(1.9, 2.38, -9.82, Math.PI, 'LANTAI 1 // AREA STAF >>');

      const steelDoorMat = new THREE.MeshStandardMaterial({
        color: 0x2b3330,
        roughness: 0.45,
        metalness: 0.78
      });
      this.floor2StairDoorPivot = new THREE.Group();
      this.floor2StairDoorPivot.position.set(4.0, 0, -10.52);
      this.floorTwoGroup.add(this.floor2StairDoorPivot);

      const f2StairDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.22, 1.16), steelDoorMat);
      f2StairDoorMesh.position.set(0, 1.11, -0.58);
      f2StairDoorMesh.userData = { interactableType: 'floor2_padlock' };
      this.floor2StairDoorPivot.add(f2StairDoorMesh);

      // Lilitan Rantai Besi Tebal & Gembok Kombinasi 3 Angka (padlockMesh)
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0x3f3f46,
        roughness: 0.4,
        metalness: 0.88
      });
      this.floor2ChainsGroup = new THREE.Group();
      this.floor2ChainsGroup.position.set(4.08, 1.12, -11.1);
      this.floorTwoGroup.add(this.floor2ChainsGroup);

      for (let i = -1; i <= 1; i++) {
        const chainBar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.22, 10), chainMat);
        chainBar.rotation.x = Math.PI / 2 + i * 0.22;
        chainBar.position.set(0, i * 0.12, 0);
        chainBar.userData = { interactableType: 'floor2_padlock' };
        this.floor2ChainsGroup.add(chainBar);
      }

      // Gembok Kombinasi 3 Angka (padlockMesh)
      const brassPadlockMat = new THREE.MeshStandardMaterial({
        color: 0xb48327,
        emissive: 0x332205,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.85
      });
      this.padlockMesh = new THREE.Group();
      this.padlockMesh.position.set(4.14, 1.08, -11.1);
      this.floorTwoGroup.add(this.padlockMesh);

      const padlockBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.16), brassPadlockMat);
      padlockBody.userData = { interactableType: 'floor2_padlock' };
      this.padlockMesh.add(padlockBody);

      const padlockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 10, 18, Math.PI), chainMat);
      padlockShackle.rotation.y = Math.PI / 2;
      padlockShackle.position.set(0, 0.11, 0);
      padlockShackle.userData = { interactableType: 'floor2_padlock' };
      this.padlockMesh.add(padlockShackle);

      // 3 Roda Angka Kombinasi pada Gembok
      [-0.04, 0, 0.04].forEach((dy) => {
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 12), chainMat);
        dial.position.set(0.015, dy, 0);
        dial.userData = { interactableType: 'floor2_padlock' };
        this.padlockMesh.add(dial);
      });

      const padlockHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.5, 1.35),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      padlockHitbox.position.set(4.15, 1.15, -11.1);
      padlockHitbox.userData = { interactableType: 'floor2_padlock' };
      this.floorTwoGroup.add(padlockHitbox);

      this.interactables.push(f2StairDoorMesh, padlockBody, padlockShackle, padlockHitbox);

      // ====================================================================
      // C. BAHAYA AIR BERLISTRIK (ELECTRIFIED WATER HAZARD) DI KORIDOR TIMUR (x = 18.6, z = -17.5)
      // ====================================================================
      this.electrifiedWaterBox3 = new THREE.Box3(
        new THREE.Vector3(17.2, -0.5, -19.1),
        new THREE.Vector3(20.0, 2.5, -15.9)
      );

      this.sparkingCableGroup = new THREE.Group();
      this.sparkingCableGroup.position.set(18.6, 0, -17.5);
      this.floorTwoGroup.add(this.sparkingCableGroup);

      const cableWireMat = new THREE.MeshStandardMaterial({
        color: 0x111317,
        roughness: 0.6,
        metalness: 0.4
      });
      const danglingCable = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.05, 10), cableWireMat);
      danglingCable.position.set(0, 1.52, 0);
      danglingCable.rotation.z = 0.08;
      this.sparkingCableGroup.add(danglingCable);

      // Cincin Busur Listrik Biru-Putih di Permukaan Air
      this.electricArcMat = new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.85
      });
      const arcRing = new THREE.Mesh(new THREE.RingGeometry(0.25, 1.15, 24), this.electricArcMat);
      arcRing.rotation.x = -Math.PI / 2;
      arcRing.position.set(0, 0.095, 0);
      this.sparkingCableGroup.add(arcRing);

      this.electricSparkLight = new THREE.PointLight(0x60a5fa, 2.2, 8.5, 1.6);
      this.electricSparkLight.position.set(18.6, 0.35, -17.5);
      this.floorTwoGroup.add(this.electricSparkLight);

      // ====================================================================
      // D. KAMAR 201 (MEJA RIAS + MEMO PANTULAN AIR), TEMBOK JEBOL, & KAMAR 203 (SEKRING + ANGKA "7")
      // - Kamar 201: x = 0.0 s/d 4.0, z = -14.0 s/d -18.4
      // - Kamar 203: x = 0.0 s/d 4.0, z = -18.4 s/d -22.8
      // ====================================================================
      // Dinding Barat Koridor Barat (x = 4.0, z = -12.5 s/d -24.5) dengan Bukaan Pintu Kamar 201 di z = -15.65..-16.75
      addF2Wall(0.22, 3.1, 3.15, 4.0, 1.55, -14.075);
      addF2Wall(0.22, 3.1, 7.75, 4.0, 1.55, -20.625);
      addF2Wall(0.22, 0.85, 1.1, 4.0, 2.68, -16.2);

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '201', 4.12, 1.62, -15.35, Math.PI / 2);
      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '203', 4.12, 1.62, -20.2, Math.PI / 2);

      // Daun Pintu Kamar 201 Terbuka Separuh (rotation.y = 0.78 rad ke dalam kamar)
      const r201DoorPivot = new THREE.Group();
      r201DoorPivot.position.set(4.0, 0, -15.68);
      r201DoorPivot.rotation.y = -0.82;
      this.floorTwoGroup.add(r201DoorPivot);

      const r201DoorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.15, 1.02), this.darkWoodMat);
      r201DoorLeaf.position.set(0, 1.075, -0.51);
      r201DoorPivot.add(r201DoorLeaf);

      // Dinding Luar Kamar 201 & 203 (Barat x = 0.0, Selatan z = -14.0, Utara z = -22.8)
      addF2Wall(4.0, 3.1, 0.22, 2.0, 1.55, -14.0);
      addF2Wall(4.0, 3.1, 0.22, 2.0, 1.55, -22.8);
      addF2Wall(0.22, 3.1, 8.8, 0.0, 1.55, -18.4);

      // DINDING PEMBATAS KAMAR 201 & KAMAR 203 YANG JEBOL BERLUBANG BESAR (z = -18.4)
      // Lubang jebol di x = 1.25 s/d 2.75 (lebar 1.5m) dan tinggi 1.18m dari lantai (bisa dilewati dengan merunduk!)
      addF2Wall(1.25, 3.1, 0.24, 0.625, 1.55, -18.4);
      addF2Wall(1.25, 3.1, 0.24, 3.375, 1.55, -18.4);
      // Balok dinding atas di atas lubang jebol (mulai dari y = 1.18m ke y = 3.1m)
      addF2Wall(1.5, 1.92, 0.24, 2.0, 2.14, -18.4);

      // Puing-puing Bata Pecah di Sekitar Lubang Tembok Jebol (z = -18.4)
      [
        [1.35, 0.14, -18.15, 0.2, 0.4, 0.1],
        [2.62, 0.14, -18.62, -0.1, 0.7, 0.2],
        [1.95, 0.10, -18.38, 0.05, -0.3, 0.08]
      ].forEach(([bx, by, bz, rx, ry, rz]) => {
        const brick = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), debrisMat);
        brick.position.set(bx, by, bz);
        brick.rotation.set(rx, ry, rz);
        this.floorTwoGroup.add(brick);
      });

      // Meja Rias Kamar 201 (x = 1.15, z = -15.15) & Memo Penghuni tentang Pantulan Air
      const vanityDesk = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.78, 0.65), this.darkWoodMat);
      vanityDesk.position.set(1.15, 0.39, -15.15);
      vanityDesk.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(vanityDesk);

      const memoCanvas = document.createElement('canvas');
      memoCanvas.width = 256;
      memoCanvas.height = 256;
      const mctx = memoCanvas.getContext('2d');
      mctx.fillStyle = '#e7dec8';
      mctx.fillRect(0, 0, 256, 256);
      mctx.fillStyle = '#1c1917';
      mctx.font = 'bold 18px monospace';
      mctx.fillText('CATATAN PENGHUNI 201', 18, 38);
      mctx.fillStyle = '#991b1b';
      mctx.font = 'bold 16px monospace';
      mctx.fillText('JANGAN LIHAT AIRNYA!', 18, 76);
      mctx.fillStyle = '#292524';
      mctx.font = '14px monospace';
      mctx.fillText('Mata merah itu memantul', 18, 114);
      mctx.fillText('di genangan air lorong.', 18, 138);
      mctx.fillText('Buang muka ke dinding', 18, 172);
      mctx.fillText('samping saat lewat!', 18, 196);

      const memoTex = new THREE.CanvasTexture(memoCanvas);
      const room201MemoMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.02, 0.32),
        new THREE.MeshStandardMaterial({
          map: memoTex,
          emissive: 0x332b1a,
          emissiveMap: memoTex,
          emissiveIntensity: 0.55
        })
      );
      room201MemoMesh.position.set(1.15, 0.80, -15.15);
      room201MemoMesh.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(room201MemoMesh);

      const memoHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 1.2, 0.9),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      memoHitbox.position.set(1.15, 0.85, -15.15);
      memoHitbox.userData = { interactableType: 'room201_memo' };
      this.floorTwoGroup.add(memoHitbox);
      this.interactables.push(vanityDesk, room201MemoMesh, memoHitbox);

      const r201Light = new THREE.PointLight(0xffb366, 0.75, 6.0, 2);
      r201Light.position.set(1.5, 2.4, -16.0);
      this.floorTwoGroup.add(r201Light);

      // ====================================================================
      // E. KAMAR 203: KOTAK SEKRING MANUAL (breakerSwitchMesh) & ANGKA "7" DI DINDING
      // ====================================================================
      const breakerBoxGroup = new THREE.Group();
      breakerBoxGroup.position.set(0.18, 1.38, -20.85);
      this.floorTwoGroup.add(breakerBoxGroup);

      const breakerCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.58, 0.44), steelDoorMat);
      breakerCabinet.userData = { interactableType: 'floor2_breaker' };
      breakerBoxGroup.add(breakerCabinet);

      this.floor2BreakerLeverPivot = new THREE.Group();
      this.floor2BreakerLeverPivot.position.set(0.09, 0.05, 0);
      this.floor2BreakerLeverPivot.rotation.z = -0.45; // Posisi awal ON (ke atas)
      breakerBoxGroup.add(this.floor2BreakerLeverPivot);

      const rustyHandleMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        emissive: 0x450a0a,
        emissiveIntensity: 0.6,
        roughness: 0.4,
        metalness: 0.7
      });
      this.breakerSwitchMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.14), rustyHandleMat);
      this.breakerSwitchMesh.position.set(0.08, 0, 0);
      this.breakerSwitchMesh.userData = { interactableType: 'floor2_breaker' };
      this.floor2BreakerLeverPivot.add(this.breakerSwitchMesh);

      const breakerHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 1.1, 0.95),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      breakerHitbox.position.set(0.35, 1.38, -20.85);
      breakerHitbox.userData = { interactableType: 'floor2_breaker' };
      this.floorTwoGroup.add(breakerHitbox);
      this.interactables.push(breakerCabinet, this.breakerSwitchMesh, breakerHitbox);

      // Angka Tercakar di Dinding Samping Kotak Sekring: "7" (Digit Pertama)
      const d7Canvas = document.createElement('canvas');
      d7Canvas.width = 256;
      d7Canvas.height = 256;
      const d7ctx = d7Canvas.getContext('2d');
      d7ctx.fillStyle = '#18221d';
      d7ctx.fillRect(0, 0, 256, 256);
      // Goresan cakaran merah darah / karat
      d7ctx.strokeStyle = '#dc2626';
      d7ctx.lineWidth = 18;
      d7ctx.lineCap = 'round';
      d7ctx.beginPath();
      d7ctx.moveTo(58, 52);
      d7ctx.lineTo(198, 52);
      d7ctx.lineTo(104, 214);
      d7ctx.stroke();
      d7ctx.fillStyle = '#fca5a5';
      d7ctx.font = 'bold 22px "Share Tech Mono", monospace';
      d7ctx.textAlign = 'center';
      d7ctx.fillText('DIGIT I : [ 7 ]', 128, 242);

      const d7Tex = new THREE.CanvasTexture(d7Canvas);
      const digit7WallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.68, 0.68),
        new THREE.MeshStandardMaterial({
          map: d7Tex,
          emissive: 0x450a0a,
          emissiveMap: d7Tex,
          emissiveIntensity: 0.85
        })
      );
      digit7WallMesh.position.set(0.14, 1.42, -19.85);
      digit7WallMesh.userData = { interactableType: 'wall_digit_7' };
      this.floorTwoGroup.add(digit7WallMesh);
      this.interactables.push(digit7WallMesh);

      const r203Light = new THREE.PointLight(0xff7744, 0.85, 6.5, 2);
      r203Light.position.set(1.5, 2.35, -20.5);
      this.floorTwoGroup.add(r203Light);

      // ====================================================================
      // F. UJIAN PANTULAN AIR (WATER REFLECTION HAZARD) DI KORIDOR UTARA (x = 13.5, z = -23.1)
      // ====================================================================
      this.floor2ReflectionEntity = createShadowRedEyesEntity(THREE);
      this.floor2ReflectionEntity.position.set(13.5, 0, -23.1);
      this.floor2ReflectionEntity.rotation.y = -Math.PI / 2;
      this.floorTwoGroup.add(this.floor2ReflectionEntity);

      // Pantulan Sepasang Mata Merah di Permukaan Genangan Air di Depan Entitas
      this.waterReflectionEyesGroup = new THREE.Group();
      this.waterReflectionEyesGroup.position.set(12.2, 0.085, -23.1);
      this.floorTwoGroup.add(this.waterReflectionEyesGroup);

      const reflEyeMat = new THREE.MeshBasicMaterial({
        color: 0xff1111,
        transparent: true,
        opacity: 0.92
      });
      const reflLeft = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), reflEyeMat);
      reflLeft.rotation.x = -Math.PI / 2;
      reflLeft.position.set(0, 0, -0.08);
      this.waterReflectionEyesGroup.add(reflLeft);

      const reflRight = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), reflEyeMat);
      reflRight.rotation.x = -Math.PI / 2;
      reflRight.position.set(0, 0, 0.08);
      this.waterReflectionEyesGroup.add(reflRight);

      const reflRippleGlow = new THREE.PointLight(0xff0000, 1.4, 3.5, 1.8);
      reflRippleGlow.position.set(0, 0.12, 0);
      this.waterReflectionEyesGroup.add(reflRippleGlow);

      // ====================================================================
      // G. KAMAR 205 (GUDANG SERVIS & DUA DIGIT TERAKHIR: "4 - 2")
      //    Koordinat: x = 16.4 s/d 21.2, z = -24.5 s/d -28.6
      // ====================================================================
      addF2Wall(4.8, 3.1, 0.22, 18.8, 1.55, -28.6); // Dinding Utara Gudang 205
      addF2Wall(0.22, 3.1, 4.1, 16.4, 1.55, -26.55); // Dinding Barat Gudang 205
      addF2Wall(0.22, 3.1, 4.1, 21.2, 1.55, -26.55); // Dinding Timur Gudang 205
      addF2Wall(1.6, 3.1, 0.22, 17.2, 1.55, -24.5);  // Dinding Selatan Kiri Pintu 205
      addF2Wall(2.0, 3.1, 0.22, 20.2, 1.55, -24.5);  // Dinding Selatan Kanan Pintu 205

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '205', 17.75, 1.62, -24.36, 0);

      // Rak Gudang Servis & Papan Memo Inventaris bertuliskan "4 - 2"
      const storageRack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 0.6), this.ductMetalMat);
      storageRack.position.set(17.3, 0.95, -27.2);
      this.floorTwoGroup.add(storageRack);

      const m205Canvas = document.createElement('canvas');
      m205Canvas.width = 512;
      m205Canvas.height = 320;
      const ctx205 = m205Canvas.getContext('2d');
      ctx205.fillStyle = '#f5f5dc';
      ctx205.fillRect(0, 0, 512, 320);
      ctx205.strokeStyle = '#334155';
      ctx205.lineWidth = 10;
      ctx205.strokeRect(8, 8, 496, 304);
      ctx205.fillStyle = '#0f172a';
      ctx205.font = 'bold 26px "Share Tech Mono", monospace';
      ctx205.textAlign = 'center';
      ctx205.fillText('MEMO INVENTARIS GUDANG 205', 256, 56);
      ctx205.fillStyle = '#475569';
      ctx205.font = '20px "Share Tech Mono", monospace';
      ctx205.fillText('GEMBOK TANGGA DARURAT LT.2 (DIGIT 2 & 3):', 256, 108);
      ctx205.fillStyle = '#b91c1c';
      ctx205.font = 'bold 92px "Share Tech Mono", monospace';
      ctx205.fillText('4 - 2', 256, 212);
      ctx205.fillStyle = '#15803d';
      ctx205.font = 'bold 24px "Share Tech Mono", monospace';
      ctx205.fillText('KODE LENGKAP: [ 7 - 4 - 2 ]', 256, 278);

      const m205Tex = new THREE.CanvasTexture(m205Canvas);
      const room205BoardMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.15, 0.72, 0.04),
        new THREE.MeshStandardMaterial({
          map: m205Tex,
          emissive: 0x2a2618,
          emissiveMap: m205Tex,
          emissiveIntensity: 0.75
        })
      );
      room205BoardMesh.position.set(18.8, 1.48, -28.42);
      room205BoardMesh.userData = { interactableType: 'room205_memo' };
      this.floorTwoGroup.add(room205BoardMesh);

      const m205Hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 0.85),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      m205Hitbox.position.set(18.8, 1.4, -28.15);
      m205Hitbox.userData = { interactableType: 'room205_memo' };
      this.floorTwoGroup.add(m205Hitbox);
      this.interactables.push(room205BoardMesh, m205Hitbox);

      const r205Light = new THREE.PointLight(0xa3e635, 0.9, 6.5, 2);
      r205Light.position.set(18.8, 2.45, -26.8);
      this.floorTwoGroup.add(r205Light);

      // Entitas Pengejar Air (Water Dash Chase Entity) saat Gembok 7-4-2 Terbuka
      this.floor2ChaseEntity = createShadowRedEyesEntity(THREE);
      this.floor2ChaseEntity.position.set(12.5, 0, -11.1);
      this.floor2ChaseEntity.visible = false;
      this.floorTwoGroup.add(this.floor2ChaseEntity);

      // Bangun Tangga Darurat Menurun Lantai 2 -> Lantai 1 & Koridor Staf Lantai 1 (Radio HT Maya & Dhafir)
      this._buildFloorOneStairwellAndStaffCorridor();
    }

    /**
     * Membangun:
     * 1. Tangga Darurat Menurun dari Bordes Lantai 2 (z = -9.7, y = 0.0m) menuju Lantai 1 (z = -1.3, y = -4.2m)
     * 2. Bordes Bawah Tangga & Pintu Keluar Darurat berlabel "Lantai 1 - Area Staf" (x = 1.9, y = -4.2m, z = +1.5)
     * 3. Koridor Staf Lantai Dasar yang kering, bernuansa dingin, berlampu neon remang (z = +1.5 s/d +17.5, y = -4.2m)
     * 4. Meja Pos Keamanan Kecil, Loker Inventaris, & Unit Radio HT (radioHTMesh) dengan LED indikator berkedip
     * 5. Pintu Double-Door di ujung koridor staf (z = +17.5) menuju Ruang Kontrol Keamanan / Koridor Lobi Lantai 1
     */
    _buildFloorOneStairwellAndStaffCorridor() {
      const THREE = window.THREE;

      const stairTreadMat = new THREE.MeshStandardMaterial({
        color: 0x283038,
        roughness: 0.68,
        metalness: 0.25
      });
      const stairRiserMat = new THREE.MeshStandardMaterial({
        color: 0x181d22,
        roughness: 0.82,
        metalness: 0.15
      });
      const safetyNosingMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x3b1d04,
        emissiveIntensity: 0.45,
        roughness: 0.4
      });
      const shaftWallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1e252d,
        roughness: 0.76,
        metalness: 0.12
      });
      const coldDryFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x1c232b,
        roughness: 0.62,
        metalness: 0.14,
        side: THREE.DoubleSide
      });
      const coldStaffWallMat = new THREE.MeshStandardMaterial({
        map: this.corridorWallMat.map,
        color: 0x1f2733,
        roughness: 0.72,
        metalness: 0.14
      });
      const coldStaffCeilMat = new THREE.MeshStandardMaterial({
        color: 0x131820,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x323942,
        roughness: 0.42,
        metalness: 0.78
      });

      // ====================================================================
      // 1. TANGGA DARURAT LANTAI 2 -> LANTAI 1 (x = 1.9, z = -9.7 s/d -1.3, y = 0.0m s/d -4.2m)
      // ====================================================================
      const stepCount = 21;
      const stairWidth = 1.76;
      for (let i = 0; i < stepCount; i++) {
        const sz = -9.7 + (i + 0.5) * 0.4;
        const sy = -((i + 1) / stepCount) * 4.2;

        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.42), stairTreadMat);
        tread.position.set(1.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.floorTwoGroup.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), safetyNosingMat);
        nosing.position.set(1.9, sy - 0.01, sz + 0.19);
        this.floorTwoGroup.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.21, 0.04), stairRiserMat);
        riser.position.set(1.9, sy + 0.10, sz - 0.19);
        this.floorTwoGroup.add(riser);
      }

      // Pegangan Besi (Handrail) Kiri & Kanan Tangga Darurat
      [-0.82, 0.82].forEach((offsetX) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 9.4, 8), steelMat);
        rail.rotation.x = Math.PI / 2 + 0.46;
        rail.position.set(1.9 + offsetX, -1.25, -5.5);
        this.floorTwoGroup.add(rail);
      });

      // Dinding Kiri & Kanan Terowongan Tangga Darurat (x = 0.92 dan x = 2.88, z = -9.7 s/d +1.5)
      const shaftWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.8, 11.4), shaftWallMat);
      shaftWallLeft.position.set(0.92, -0.8, -4.1);
      this.floorTwoGroup.add(shaftWallLeft);

      const shaftWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 7.8, 11.4), shaftWallMat);
      shaftWallRight.position.set(2.88, -0.8, -4.1);
      this.floorTwoGroup.add(shaftWallRight);

      const shaftCeiling = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.18, 11.4), coldStaffCeilMat);
      shaftCeiling.position.set(1.9, 2.95, -4.1);
      this.floorTwoGroup.add(shaftCeiling);

      // Lampu Dinding Tangga Darurat menuju Lantai 1
      const stairMidLight = new THREE.PointLight(0xffaa55, 0.9, 9.0, 2);
      stairMidLight.position.set(1.9, -0.6, -5.2);
      this.floorTwoGroup.add(stairMidLight);

      // Bordes Bawah Tangga Darurat Lantai 1 (x = 0.9..2.9, z = -1.3 s/d +1.5, y = -4.2m)
      const lowerLandingFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 3.0), coldDryFloorMat);
      lowerLandingFloor.position.set(1.9, -4.26, 0.1);
      lowerLandingFloor.receiveShadow = true;
      this.floorTwoGroup.add(lowerLandingFloor);

      const lowerLandingLight = new THREE.PointLight(0x88ccff, 0.95, 7.5, 2);
      lowerLandingLight.position.set(1.9, -1.65, 0.6);
      this.floorTwoGroup.add(lowerLandingLight);

      // ====================================================================
      // 2. PINTU KELUAR DARURAT BERLABEL "Lantai 1 - Area Staf" (x = 1.9, y = -4.2m, z = +1.5)
      // ====================================================================
      const f1DoorWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.22), shaftWallMat);
      f1DoorWallLeft.position.set(1.12, -2.6, 1.5);
      this.floorTwoGroup.add(f1DoorWallLeft);

      const f1DoorWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.2, 0.22), shaftWallMat);
      f1DoorWallRight.position.set(2.68, -2.6, 1.5);
      this.floorTwoGroup.add(f1DoorWallRight);

      const f1DoorWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 0.22), shaftWallMat);
      f1DoorWallHeader.position.set(1.9, -1.48, 1.5);
      this.floorTwoGroup.add(f1DoorWallHeader);

      // Pelat Label Pintu "Lantai 1 - Area Staf"
      const f1SignCanvas = document.createElement('canvas');
      f1SignCanvas.width = 512;
      f1SignCanvas.height = 160;
      const f1ctx = f1SignCanvas.getContext('2d');
      f1ctx.fillStyle = '#0f172a';
      f1ctx.fillRect(0, 0, 512, 160);
      f1ctx.strokeStyle = '#38bdf8';
      f1ctx.lineWidth = 8;
      f1ctx.strokeRect(8, 8, 496, 144);
      f1ctx.fillStyle = '#f8fafc';
      f1ctx.font = 'bold 34px "Share Tech Mono", monospace';
      f1ctx.textAlign = 'center';
      f1ctx.fillText('Lantai 1 - Area Staf', 256, 70);
      f1ctx.fillStyle = '#7dd3fc';
      f1ctx.font = 'bold 22px "Share Tech Mono", monospace';
      f1ctx.fillText('GROUND FLOOR // STAFF CORRIDOR', 256, 118);

      const f1SignTex = new THREE.CanvasTexture(f1SignCanvas);
      const f1SignMat = new THREE.MeshStandardMaterial({
        map: f1SignTex,
        emissive: 0x0c2d48,
        emissiveMap: f1SignTex,
        emissiveIntensity: 0.85,
        roughness: 0.3
      });

      const f1HeaderSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.28, 0.04), f1SignMat);
      f1HeaderSignMesh.position.set(1.9, -1.72, 1.38);
      f1HeaderSignMesh.rotation.y = Math.PI;
      this.floorTwoGroup.add(f1HeaderSignMesh);

      this.floor1StairExitDoorPivot = new THREE.Group();
      this.floor1StairExitDoorPivot.position.set(1.34, -4.2, 1.5);
      this.floorTwoGroup.add(this.floor1StairExitDoorPivot);

      const f1ExitDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.22, 0.07), steelMat);
      f1ExitDoorMesh.position.set(0.56, 1.11, 0);
      f1ExitDoorMesh.castShadow = true;
      f1ExitDoorMesh.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1ExitDoorMesh);

      const f1DoorPlateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.24, 0.02), f1SignMat);
      f1DoorPlateMesh.position.set(0.56, 1.48, -0.045);
      f1DoorPlateMesh.rotation.y = Math.PI;
      f1DoorPlateMesh.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorPlateMesh);

      const f1DoorPushBar = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 0.06), safetyNosingMat);
      f1DoorPushBar.position.set(0.56, 1.02, -0.055);
      f1DoorPushBar.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorPushBar);

      const f1DoorHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 2.3, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      f1DoorHitbox.position.set(0.56, 1.15, 0);
      f1DoorHitbox.userData = { interactableType: 'floor1_stair_exit_door' };
      this.floor1StairExitDoorPivot.add(f1DoorHitbox);

      this.interactables.push(f1ExitDoorMesh, f1DoorPlateMesh, f1DoorPushBar, f1DoorHitbox);

      // ====================================================================
      // 3. KORIDOR STAF LANTAI 1 (KERING, DINGIN, BERLAMPU NEON REMANG, SUNYI MENCEKAM)
      //    Koordinat: x = 0.4 s/d 3.4 (lebar 3.0m), z = +1.5 s/d +17.5 (panjang 16.0m), y = -4.2m
      // ====================================================================
      const f1StaffFloor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 16.2), coldDryFloorMat);
      f1StaffFloor.position.set(1.9, -4.26, 9.5);
      f1StaffFloor.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffFloor);

      const f1StaffCeiling = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 16.2), coldStaffCeilMat);
      f1StaffCeiling.position.set(1.9, -0.96, 9.5);
      this.floorTwoGroup.add(f1StaffCeiling);

      const f1StaffWallWest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 16.2), coldStaffWallMat);
      f1StaffWallWest.position.set(0.4, -2.55, 9.5);
      f1StaffWallWest.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffWallWest);

      const f1StaffWallEast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 16.2), coldStaffWallMat);
      f1StaffWallEast.position.set(3.4, -2.55, 9.5);
      f1StaffWallEast.receiveShadow = true;
      this.floorTwoGroup.add(f1StaffWallEast);

      // Lis Dinding Biru-Abu Dingin (Dado Rail) di Koridor Staf Lantai 1
      const dadoMat = new THREE.MeshStandardMaterial({
        color: 0x2b3d4f,
        roughness: 0.55,
        metalness: 0.25
      });
      const dadoWest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 16.0), dadoMat);
      dadoWest.position.set(0.51, -3.1, 9.5);
      this.floorTwoGroup.add(dadoWest);

      const dadoEast = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 16.0), dadoMat);
      dadoEast.position.set(3.29, -3.1, 9.5);
      this.floorTwoGroup.add(dadoEast);

      // Lampu Tabung Neon Dingin Remang di Plafon Koridor Staf Lantai 1
      [4.2, 9.5, 14.8].forEach((lz, idx) => {
        const neonMat = new THREE.MeshStandardMaterial({
          color: 0xdbeafe,
          emissive: 0x7dd3fc,
          emissiveIntensity: 0.55,
          roughness: 0.2
        });
        const tube = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.25), neonMat);
        tube.position.set(1.9, -1.04, lz);
        this.floorTwoGroup.add(tube);

        const pt = new THREE.PointLight(0x93c5fd, 0.68, 8.5, 2);
        pt.position.set(1.9, -1.18, lz);
        this.floorTwoGroup.add(pt);
        this.floor1StaffNeonLights.push({ light: pt, mat: neonMat, phase: idx * 2.1 });
      });

      // ====================================================================
      // 4. LOKER INVENTARIS & MEJA POS KEAMANAN + RADIO HT (radioHTMesh)
      //    Posisi Meja Keamanan: x = 0.95, y = -4.2m, z = +7.8
      // ====================================================================
      // Loker Inventaris Besi 3 Pintu di Samping Meja Keamanan (x = 0.78, y = -4.2m, z = +5.8)
      const lockerGroup = new THREE.Group();
      lockerGroup.position.set(0.78, -4.2, 5.8);
      const lockerBody = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.92, 1.35), steelMat);
      lockerBody.position.set(0, 0.96, 0);
      lockerBody.castShadow = true;
      lockerGroup.add(lockerBody);
      [-0.42, 0, 0.42].forEach((dz) => {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 1.76, 0.38),
          new THREE.MeshStandardMaterial({ color: 0x242b33, roughness: 0.5, metalness: 0.8 })
        );
        seam.position.set(0.265, 0.98, dz);
        lockerGroup.add(seam);
      });
      this.floorTwoGroup.add(lockerGroup);

      // Meja Pos Keamanan Kecil di Samping Koridor (x = 0.98, y = -4.2m, z = +7.8)
      const securityDeskGroup = new THREE.Group();
      securityDeskGroup.position.set(0.98, -4.2, 7.8);

      const sDeskTop = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.06, 1.45), this.darkWoodMat);
      sDeskTop.position.set(0, 0.76, 0);
      sDeskTop.castShadow = true;
      sDeskTop.receiveShadow = true;
      sDeskTop.userData = { interactableType: 'radio_ht' };
      securityDeskGroup.add(sDeskTop);

      const sDeskPanel = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.74, 1.38), steelMat);
      sDeskPanel.position.set(-0.02, 0.37, 0);
      sDeskPanel.castShadow = true;
      securityDeskGroup.add(sDeskPanel);

      this.floorTwoGroup.add(securityDeskGroup);

      // Lampu Meja Kecil di Pos Keamanan agar Radio HT tampak jelas
      const deskLampLight = new THREE.PointLight(0xbae6fd, 0.82, 4.5, 2);
      deskLampLight.position.set(1.05, -3.05, 7.8);
      this.floorTwoGroup.add(deskLampLight);

      // Unit Radio Handy Talkie (this.radioHTMesh) di Atas Meja Keamanan (x = 1.08, y = -3.41m, z = +7.8)
      this.radioHTMesh = new THREE.Group();
      this.radioHTMesh.position.set(1.08, -3.41, 7.8);
      this.radioHTMesh.rotation.y = 0.45;

      const htBodyMat = new THREE.MeshStandardMaterial({
        color: 0x11151c,
        roughness: 0.45,
        metalness: 0.65
      });
      const htBody = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.21, 0.055), htBodyMat);
      htBody.position.set(0, 0.105, 0);
      htBody.castShadow = true;
      htBody.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htBody);

      // Antena Vertikal Radio HT
      const htAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.19, 10), htBodyMat);
      htAntenna.position.set(-0.026, 0.29, 0);
      htAntenna.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htAntenna);

      // Layar Frekuensi LCD Kecil pada Radio HT ("CH-04")
      const lcdMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const htLcd = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.036), lcdMat);
      htLcd.position.set(0, 0.145, 0.029);
      htLcd.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(htLcd);

      // Lampu LED Indikator pada Radio HT (Hijau berkedip pelan, lalu Hijau-Merah cepat saat memanggil)
      this.radioLEDMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      this.radioLEDMesh = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), this.radioLEDMat);
      this.radioLEDMesh.position.set(0.026, 0.215, 0.018);
      this.radioLEDMesh.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(this.radioLEDMesh);

      this.radioLEDLight = new THREE.PointLight(0x22c55e, 1.15, 2.8, 1.8);
      this.radioLEDLight.position.set(0.026, 0.24, 0.04);
      this.radioHTMesh.add(this.radioLEDLight);

      // Hitbox Raycaster Radio HT agar mudah diarahkan dari jarak interaksi
      const radioHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.95, 1.15),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      radioHitbox.position.set(0, 0.22, 0);
      radioHitbox.userData = { interactableType: 'radio_ht' };
      this.radioHTMesh.add(radioHitbox);

      this.floorTwoGroup.add(this.radioHTMesh);
      this.interactables.push(sDeskTop, htBody, htAntenna, htLcd, this.radioLEDMesh, radioHitbox);

      // ====================================================================
      // 5. PINTU DOUBLE-DOOR DI UJUNG KORIDOR STAF (x = 1.9, y = -4.2m, z = +17.5)
      //    Menuju Ruang Kontrol Keamanan / Koridor Lobi Lantai 1 (z = +17.5 s/d +23.5)
      // ====================================================================
      const ddWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.3, 0.22), coldStaffWallMat);
      ddWallLeft.position.set(0.725, -2.55, 17.5);
      this.floorTwoGroup.add(ddWallLeft);

      const ddWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.3, 0.22), coldStaffWallMat);
      ddWallRight.position.set(3.075, -2.55, 17.5);
      this.floorTwoGroup.add(ddWallRight);

      const ddWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 0.22), coldStaffWallMat);
      ddWallHeader.position.set(1.9, -1.38, 17.5);
      this.floorTwoGroup.add(ddWallHeader);

      // Indikator Kunci Magnetik di Atas Double-Door (Merah saat Terkunci, Hijau setelah Dialog Dhafir)
      this.floor1DoubleDoorLockMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const ddLockLamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.05), this.floor1DoubleDoorLockMat);
      ddLockLamp.position.set(1.9, -1.78, 17.38);
      this.floorTwoGroup.add(ddLockLamp);

      this.floor1DoubleDoorLockLight = new THREE.PointLight(0xef4444, 1.1, 4.5, 2);
      this.floor1DoubleDoorLockLight.position.set(1.9, -1.82, 17.25);
      this.floorTwoGroup.add(this.floor1DoubleDoorLockLight);

      this.floor1DoubleDoorLeftPivot = new THREE.Group();
      this.floor1DoubleDoorLeftPivot.position.set(1.05, -4.2, 17.5);
      this.floorTwoGroup.add(this.floor1DoubleDoorLeftPivot);

      const ddLeftLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.28, 0.07), steelMat);
      ddLeftLeaf.position.set(0.42, 1.14, 0);
      ddLeftLeaf.userData = { interactableType: 'floor1_double_door' };
      this.floor1DoubleDoorLeftPivot.add(ddLeftLeaf);

      this.floor1DoubleDoorRightPivot = new THREE.Group();
      this.floor1DoubleDoorRightPivot.position.set(2.75, -4.2, 17.5);
      this.floorTwoGroup.add(this.floor1DoubleDoorRightPivot);

      const ddRightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.84, 2.28, 0.07), steelMat);
      ddRightLeaf.position.set(-0.42, 1.14, 0);
      ddRightLeaf.userData = { interactableType: 'floor1_double_door' };
      this.floor1DoubleDoorRightPivot.add(ddRightLeaf);

      const ddHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 2.35, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      ddHitbox.position.set(1.9, -3.05, 17.5);
      ddHitbox.userData = { interactableType: 'floor1_double_door' };
      this.floorTwoGroup.add(ddHitbox);

      this.interactables.push(ddLeftLeaf, ddRightLeaf, ddHitbox);

      // Simpan referensi doorMesh untuk status kunci magnetik pintu hidrolik Ruang Arsip
      this.archiveDoorMesh = ddLeftLeaf;
      this.archiveDoorMesh.isLocked = true;

      // Panel Kunci Elektronik yang Konslet/Mati di Samping Pintu Hidrolik (x = 1.02, y = -2.95, z = +17.65)
      const panelBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.06), steelMat);
      panelBox.position.set(0.88, -2.95, 17.65);
      panelBox.userData = { interactableType: 'archive_hydraulic_door' };
      this.floorTwoGroup.add(panelBox);

      this.archiveElectronicPanelMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
      const panelScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), this.archiveElectronicPanelMat);
      panelScreen.position.set(0.88, -2.90, 17.685);
      panelScreen.userData = { interactableType: 'archive_hydraulic_door' };
      this.floorTwoGroup.add(panelScreen);

      this.archiveElectronicSparkLight = new THREE.PointLight(0xff3333, 0.85, 3.2, 2);
      this.archiveElectronicSparkLight.position.set(0.88, -2.90, 17.78);
      this.floorTwoGroup.add(this.archiveElectronicSparkLight);
      this.interactables.push(panelBox, panelScreen);

      // ====================================================================
      // 6. RUANG ARSIP DARURAT LANTAI 1 (THE PANIC ARCHIVE ROOM)
      //    Koordinat: x = -1.1 s/d +4.9 (lebar 6.0m), z = +17.5 s/d +24.5 (panjang 7.0m), y = -4.2m
      // ====================================================================
      const archiveSteelWallMat = new THREE.MeshStandardMaterial({
        color: 0x161a20,
        roughness: 0.58,
        metalness: 0.62
      });
      const acousticFoamMat = new THREE.MeshStandardMaterial({
        color: 0x22262c,
        roughness: 0.96,
        metalness: 0.04
      });

      const archiveFloor = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 7.2), coldDryFloorMat);
      archiveFloor.position.set(1.9, -4.26, 21.0);
      archiveFloor.receiveShadow = true;
      this.floorTwoGroup.add(archiveFloor);

      const archiveCeil = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 7.2), coldStaffCeilMat);
      archiveCeil.position.set(1.9, -0.96, 21.0);
      this.floorTwoGroup.add(archiveCeil);

      // Dinding Baja Lapis Ganda Ruang Arsip (Barat x = -1.1, Timur x = +4.9, Utara Kiri-Kanan z = +17.5, Selatan Kiri-Kanan z = +24.5)
      const archNorthLeft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.3, 0.22), archiveSteelWallMat);
      archNorthLeft.position.set(-0.3, -2.55, 17.5);
      this.floorTwoGroup.add(archNorthLeft);

      const archNorthRight = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.3, 0.22), archiveSteelWallMat);
      archNorthRight.position.set(4.1, -2.55, 17.5);
      this.floorTwoGroup.add(archNorthRight);

      const archWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.3, 7.2), archiveSteelWallMat);
      archWestWall.position.set(-1.1, -2.55, 21.0);
      this.floorTwoGroup.add(archWestWall);

      const archEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.3, 7.2), archiveSteelWallMat);
      archEastWall.position.set(4.9, -2.55, 21.0);
      this.floorTwoGroup.add(archEastWall);

      // Dinding Selatan Ruang Arsip (z = +24.5) dengan Bukaan Pintu Hidrolik Keluar menuju Lobi (x = 1.25..2.55)
      const archSouthLeft = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.3, 0.24), archiveSteelWallMat);
      archSouthLeft.position.set(0.075, -2.55, 24.5);
      this.floorTwoGroup.add(archSouthLeft);

      const archSouthRight = new THREE.Mesh(new THREE.BoxGeometry(2.35, 3.3, 0.24), archiveSteelWallMat);
      archSouthRight.position.set(3.725, -2.55, 24.5);
      this.floorTwoGroup.add(archSouthRight);

      const archSouthHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.24), archiveSteelWallMat);
      archSouthHeader.position.set(1.9, -1.38, 24.5);
      this.floorTwoGroup.add(archSouthHeader);

      // Lapisan Panel Busa Peredam Suara Akustik Abu-Abu Gelap di Dinding Ruang Arsip
      for (let fz = 18.2; fz <= 23.8; fz += 0.92) {
        const foamW = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.78), acousticFoamMat);
        foamW.position.set(-0.96, -2.55, fz);
        this.floorTwoGroup.add(foamW);

        const foamE = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.35, 0.78), acousticFoamMat);
        foamE.position.set(4.76, -2.55, fz);
        this.floorTwoGroup.add(foamE);
      }

      // Ventilasi Udara Tertutup Teralis Besi Rapat di Dinding Atas Ruang Arsip
      [-0.95, 4.75].forEach((vx) => {
        const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.86), steelMat);
        ventFrame.position.set(vx, -1.38, 21.0);
        this.floorTwoGroup.add(ventFrame);
        for (let b = -0.32; b <= 0.32; b += 0.16) {
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8), steelMat);
          bar.position.set(vx, -1.38, 21.0 + b);
          this.floorTwoGroup.add(bar);
        }
      });

      // Jejeran Lemari Arsip Dokumen Logam Tinggi (Tall Metal Filing Cabinets)
      const cabinetMat = new THREE.MeshStandardMaterial({
        color: 0x2c343e,
        roughness: 0.48,
        metalness: 0.72
      });
      const cabinetPositions = [
        [-0.48, -4.2, 18.8, Math.PI / 2],
        [-0.48, -4.2, 20.2, Math.PI / 2],
        [-0.48, -4.2, 21.6, Math.PI / 2],
        [4.28, -4.2, 18.8, -Math.PI / 2],
        [4.28, -4.2, 20.2, -Math.PI / 2],
        // Lemari Arsip Tebal di Sudut Belakang tempat Maya berlindung saat Dhafir menembak engsel!
        [-0.25, -4.2, 23.35, 0]
      ];
      cabinetPositions.forEach(([cx, cy, cz, ry]) => {
        const cabGroup = new THREE.Group();
        cabGroup.position.set(cx, cy, cz);
        cabGroup.rotation.y = ry;
        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.12, 0.58), cabinetMat);
        cabBody.position.set(0, 1.06, 0);
        cabBody.castShadow = true;
        cabBody.receiveShadow = true;
        cabGroup.add(cabBody);
        for (let d = 0; d < 4; d++) {
          const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.44, 0.03), steelMat);
          drawer.position.set(0, 0.32 + d * 0.48, 0.30);
          cabGroup.add(drawer);
        }
        this.floorTwoGroup.add(cabGroup);
      });

      // Meja Kerja dengan Berkas Berserakan ("PROJECT BLINDSPOT // DR. MARK EVANS")
      const archiveDeskGroup = new THREE.Group();
      archiveDeskGroup.position.set(3.35, -4.2, 22.4);
      const aDeskTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.78, 0.82), this.darkWoodMat);
      aDeskTop.position.set(0, 0.39, 0);
      aDeskTop.castShadow = true;
      archiveDeskGroup.add(aDeskTop);

      const filePaperMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
      const redFolderMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
      [
        [-0.28, 0.79, -0.12, 0.25],
        [0.12, 0.795, 0.08, -0.35],
        [0.32, 0.79, -0.15, 0.12]
      ].forEach(([px, py, pz, pr], idx) => {
        const docMesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.015, 0.21),
          idx === 1 ? redFolderMat : filePaperMat
        );
        docMesh.position.set(px, py, pz);
        docMesh.rotation.y = pr;
        archiveDeskGroup.add(docMesh);
      });
      this.floorTwoGroup.add(archiveDeskGroup);

      // Pencahayaan Ruang Arsip Darurat
      const archiveRoomLight = new THREE.PointLight(0x93c5fd, 0.78, 8.5, 2);
      archiveRoomLight.position.set(1.9, -1.22, 21.0);
      this.floorTwoGroup.add(archiveRoomLight);

      // ====================================================================
      // 7. PINTU HIDROLIK BAJA KELUAR RUANG ARSIP (z = +24.5) & ENGSEL CADANGAN TEREKSPOS
      // ====================================================================
      this.archiveExitDoorPivot = new THREE.Group();
      this.archiveExitDoorPivot.position.set(1.9, -4.2, 24.5);
      this.floorTwoGroup.add(this.archiveExitDoorPivot);

      this.archiveExitDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.28, 2.28, 0.10), steelMat);
      this.archiveExitDoorMesh.position.set(0, 1.14, 0);
      this.archiveExitDoorMesh.castShadow = true;
      this.archiveExitDoorMesh.userData = { interactableType: 'archive_hydraulic_door' };
      this.archiveExitDoorMesh.isLocked = true;
      this.archiveExitDoorPivot.add(this.archiveExitDoorMesh);

      // Engsel Hidrolik Cadangan yang Terekspos di Sisi Kiri-Atas & Kiri-Bawah Pintu
      const exposedHingeMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0x451a03,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.85
      });
      [0.45, 1.82].forEach((hy) => {
        const hingeCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 10), exposedHingeMat);
        hingeCyl.position.set(-0.62, hy, -0.06);
        this.archiveExitDoorPivot.add(hingeCyl);
      });

      this.interactables.push(this.archiveExitDoorMesh);

      // Partikel Percikan Api & Kepulan Asap pada Engsel Pintu saat Ditembak Dhafir (Babak 7)
      const sparkCount = 28;
      const sparkPositions = new Float32Array(sparkCount * 3);
      for (let i = 0; i < sparkCount; i++) {
        sparkPositions[i * 3 + 0] = 1.28 + (Math.random() - 0.5) * 0.45;
        sparkPositions[i * 3 + 1] = -2.55 + (Math.random() - 0.5) * 1.1;
        sparkPositions[i * 3 + 2] = 24.38 + (Math.random() - 0.5) * 0.35;
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
      this.archiveHingeSparksMat = new THREE.PointsMaterial({
        color: 0xffaa22,
        size: 0.075,
        transparent: true,
        opacity: 0
      });
      this.archiveHingeSparksPoints = new THREE.Points(sparkGeo, this.archiveHingeSparksMat);
      this.floorTwoGroup.add(this.archiveHingeSparksPoints);

      this.archiveHingeSmokeGroup = new THREE.Group();
      this.archiveHingeSmokeGroup.position.set(1.35, -2.8, 24.35);
      this.archiveHingeSmokeGroup.visible = false;
      const smokePuffMat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.42
      });
      for (let s = 0; s < 6; s++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22 + s * 0.05, 10, 10), smokePuffMat);
        puff.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4);
        this.archiveHingeSmokeGroup.add(puff);
      }
      this.floorTwoGroup.add(this.archiveHingeSmokeGroup);

      this.archiveBreachFlashLight = new THREE.PointLight(0xffaa33, 0, 7.5, 1.6);
      this.archiveBreachFlashLight.position.set(1.32, -2.55, 24.25);
      this.floorTwoGroup.add(this.archiveBreachFlashLight);

      // ====================================================================
      // 8. LORONG LOBI UTAMA, PILAR RUNTUH, & MEZZANINE (z = +24.5 s/d +36.0, y = -4.2m)
      // ====================================================================
      const lobbyFloor = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 12.0), coldDryFloorMat);
      lobbyFloor.position.set(1.9, -4.26, 30.5);
      lobbyFloor.receiveShadow = true;
      this.floorTwoGroup.add(lobbyFloor);

      const lobbyCeil = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.12, 12.0), coldStaffCeilMat);
      lobbyCeil.position.set(1.9, 0.25, 30.5);
      this.floorTwoGroup.add(lobbyCeil);

      // Dinding Kanan Koridor (x = -2.2): Memiliki bukaan pintu menuju Security Hub di z = 26.2..27.5
      // dan jendela kaca buram pengawas di z = 27.8..29.6
      const lobbyRightWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 1.7), coldStaffWallMat);
      lobbyRightWallNorth.position.set(-2.2, -1.95, 25.35);
      this.floorTwoGroup.add(lobbyRightWallNorth);

      const lobbyRightWallHeader = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.2, 1.35), coldStaffWallMat);
      lobbyRightWallHeader.position.set(-2.2, -0.75, 26.85);
      this.floorTwoGroup.add(lobbyRightWallHeader);

      const lobbyRightWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 8.5), coldStaffWallMat);
      lobbyRightWallSouth.position.set(-2.2, -1.95, 31.75);
      this.floorTwoGroup.add(lobbyRightWallSouth);

      const lobbyEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 12.0), coldStaffWallMat);
      lobbyEastWall.position.set(6.0, -1.95, 30.5);
      this.floorTwoGroup.add(lobbyEastWall);

      // Balkon Mezzanine Atas (tempat Jack & Tim Code 0 melepaskan tembakan dari balik bayangan)
      const mezzanineBeam = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 1.6), steelMat);
      mezzanineBeam.position.set(1.9, -0.85, 31.2);
      this.floorTwoGroup.add(mezzanineBeam);

      // Reruntuhan Pilar Utama Lobi (z = 29.1) yang menutup jalur lurus menuju pintu kaca lobi
      this.lobbyCollapsedPillarGroup = new THREE.Group();
      this.lobbyCollapsedPillarGroup.position.set(1.9, -4.2, 29.1);
      this.floorTwoGroup.add(this.lobbyCollapsedPillarGroup);

      const concretePillarMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.88,
        metalness: 0.18
      });
      // Batang pilar beton raksasa yang roboh melintang menghalangi jalan lobi
      const fallenPillarMain = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.74, 7.6, 12), concretePillarMat);
      fallenPillarMain.position.set(0, 0.82, 0);
      fallenPillarMain.rotation.z = Math.PI * 0.44;
      fallenPillarMain.rotation.y = -0.18;
      fallenPillarMain.castShadow = true;
      fallenPillarMain.receiveShadow = true;
      this.lobbyCollapsedPillarGroup.add(fallenPillarMain);

      const fallenBeamCross = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.75, 0.95), concretePillarMat);
      fallenBeamCross.position.set(0.1, 1.45, -0.25);
      fallenBeamCross.rotation.z = -0.19;
      this.lobbyCollapsedPillarGroup.add(fallenBeamCross);

      // Bongkahan beton & besi tulangan yang menutup rapat jalur z >= 28.6
      [
        [-1.3, 0.45, -0.35, 1.2, 0.9, 1.0],
        [0.0, 0.55, -0.40, 1.6, 1.1, 1.1],
        [1.4, 0.48, -0.30, 1.4, 0.95, 1.0],
        [2.6, 0.60, -0.25, 1.3, 1.2, 1.1]
      ].forEach(([rx, ry, rz, sx, sy, sz]) => {
        const rubble = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), concretePillarMat);
        rubble.position.set(rx, ry, rz);
        rubble.rotation.set(rx * 0.2, rz * 0.3, 0.15);
        this.lobbyCollapsedPillarGroup.add(rubble);
      });

      // Sebelum pintu arsip hancur, pilar masih berdiri tinggi; saat runtuh, turun menghantam lantai
      this.lobbyCollapsedPillarGroup.position.y = -1.2;

      // Plang Darurat Menyala yang mengarahkan ke kanan (x = -2.2, z = 26.85): "<- RUANG KONTROL KEAMANAN"
      this._createRoomNumberPlateForGroup(
        this.floorTwoGroup,
        'SECURITY HUB ->',
        -2.05,
        -1.55,
        26.85,
        Math.PI / 2
      );

      // Pintu Keluar Kaca Lobi Utama dengan Cahaya Fajar di Ujung Selatan (z = +36.2, tertutup reruntuhan pilar)
      const dawnGlassMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.3
      });
      const mainExitGlassDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.12), dawnGlassMat);
      mainExitGlassDoor.position.set(1.9, -2.6, 36.2);
      mainExitGlassDoor.userData = { interactableType: 'main_lobby_glass_exit' };
      this.floorTwoGroup.add(mainExitGlassDoor);
      this.interactables.push(mainExitGlassDoor);

      const dawnExitLight = new THREE.PointLight(0x7dd3fc, 1.2, 14.0, 1.6);
      dawnExitLight.position.set(1.9, -2.1, 35.2);
      this.floorTwoGroup.add(dawnExitLight);

      // Entitas Bayangan Bermata Merah di Atrium Lobi Utama (Mekanik Fatal Gaze Tetap Aktif)
      this.floor1LobbyEntity = createShadowRedEyesEntity(THREE);
      this.floor1LobbyEntity.position.set(3.2, -4.2, 30.8);
      this.floor1LobbyEntity.visible = false;
      this.floorTwoGroup.add(this.floor1LobbyEntity);

      // ====================================================================
      // 9. RUANG KONTROL KEAMANAN (SECURITY HUB: x = -7.6 s/d -2.2, z = +24.8 s/d +30.8, y = -4.2m)
      // ====================================================================
      const hubFloor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 6.2), coldDryFloorMat);
      hubFloor.position.set(-4.9, -4.26, 27.8);
      hubFloor.receiveShadow = true;
      this.floorTwoGroup.add(hubFloor);

      const hubCeil = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 6.2), coldStaffCeilMat);
      hubCeil.position.set(-4.9, -1.05, 27.8);
      this.floorTwoGroup.add(hubCeil);

      const hubWallMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.78,
        metalness: 0.28
      });
      const hubBackWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.3, 6.2), hubWallMat);
      hubBackWall.position.set(-7.6, -2.6, 27.8);
      this.floorTwoGroup.add(hubBackWall);

      const hubNorthWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.3, 0.22), hubWallMat);
      hubNorthWall.position.set(-4.9, -2.6, 24.8);
      this.floorTwoGroup.add(hubNorthWall);

      const hubSouthWallWest = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.3, 0.22), hubWallMat);
      hubSouthWallWest.position.set(-5.9, -2.6, 30.8);
      this.floorTwoGroup.add(hubSouthWallWest);

      // Lampu Ruangan Security Hub (Biru Taktis & Lampu Darurat Merah Berputar / Red Strobe Light)
      this.securityHubMainLight = new THREE.PointLight(0x60a5fa, 0.95, 8.5, 1.8);
      this.securityHubMainLight.position.set(-4.8, -1.35, 27.8);
      this.floorTwoGroup.add(this.securityHubMainLight);

      // Lampu Darurat Merah Berputar (Red Strobe Light) di Langit-Langit Security Hub
      this.securityHubRedStrobePivot = new THREE.Group();
      this.securityHubRedStrobePivot.position.set(-4.8, -1.18, 27.8);
      this.floorTwoGroup.add(this.securityHubRedStrobePivot);

      const strobeHousingMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0xff0000,
        emissiveIntensity: 0.15,
        roughness: 0.3,
        metalness: 0.6
      });
      this.securityHubStrobeBeamMat = strobeHousingMat;
      const strobeBeaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.18, 12), strobeHousingMat);
      this.securityHubRedStrobePivot.add(strobeBeaconMesh);

      this.securityHubRedStrobeLight = new THREE.PointLight(0xff1a1a, 0.0, 11.5, 1.6);
      this.securityHubRedStrobeLight.position.set(0.35, -0.12, 0);
      this.securityHubRedStrobePivot.add(this.securityHubRedStrobeLight);

      // Kusen Baja Fisik & Engsel Pintu Ruang Kontrol Keamanan (Security Hub Door Frame)
      const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.85 });
      const frameLeftPost = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.38, 0.12), doorFrameMat);
      frameLeftPost.position.set(-2.2, -3.01, 26.18);
      this.floorTwoGroup.add(frameLeftPost);
      const frameRightPost = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.38, 0.12), doorFrameMat);
      frameRightPost.position.set(-2.2, -3.01, 27.52);
      this.floorTwoGroup.add(frameRightPost);
      const frameTopLintel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.14, 1.46), doorFrameMat);
      frameTopLintel.position.set(-2.2, -1.85, 26.85);
      this.floorTwoGroup.add(frameTopLintel);

      // Pintu Baja Berengsel "Ruang Kontrol Keamanan" dengan Pivot Presisi pada Kusen (x = -2.2, z = 26.22)
      // Status Awal: Terbuka (-90 derajat / -Math.PI/2) sehingga Maya dapat melangkah masuk melewati ambang pintu.
      // Begitu Maya melangkah masuk, daun pintu berayun menutup halus dari -90 derajat ke 0 derajat selama 0.8 detik!
      this.securityHubDoorPivot = new THREE.Group();
      this.securityHubDoorPivot.position.set(-2.2, -4.2, 26.22);
      this.securityHubDoorPivot.rotation.y = -Math.PI / 2;
      this.floorTwoGroup.add(this.securityHubDoorPivot);

      this.securityHubDoor = new THREE.Mesh(new THREE.BoxGeometry(0.10, 2.28, 1.26), steelMat);
      this.securityHubDoor.name = 'securityHubDoor';
      this.securityHubDoor.position.set(0, 1.14, 0.63);
      this.securityHubDoor.castShadow = true;
      this.securityHubDoor.receiveShadow = true;
      this.securityHubDoor.isLocked = false;
      this.securityHubDoor.userData = { interactableType: 'security_hub_door' };
      this.securityHubDoorPivot.add(this.securityHubDoor);

      // Jendela Intip Berteralis & Handle Baja pada Daun Pintu Security Hub
      const doorViewportFrame = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.32), doorFrameMat);
      doorViewportFrame.position.set(0, 1.56, 0.63);
      this.securityHubDoorPivot.add(doorViewportFrame);

      // Silinder Engsel Fisik pada Pivot Kusen Pintu
      [0.38, 1.14, 1.92].forEach((hy) => {
        const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 10), doorFrameMat);
        hingePin.position.set(0, hy, 0.02);
        this.securityHubDoorPivot.add(hingePin);
      });

      this.securityHubDoorColliderBox3 = new THREE.Box3();

      // Gerendel Besi Manual (Heavy Sliding Bolt) pada Sisi Dalam Pintu Security Hub
      const darkIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.82 });
      const boltPlate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.42), darkIronMat);
      boltPlate.position.set(-0.07, 1.12, 1.05);
      this.securityHubDoorPivot.add(boltPlate);

      const boltBarMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0x78350f,
        emissiveIntensity: 0.65,
        roughness: 0.3,
        metalness: 0.85
      });
      this.securityHubBoltMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.36, 10), boltBarMat);
      this.securityHubBoltMesh.rotation.x = Math.PI / 2;
      this.securityHubBoltMesh.position.set(-0.10, 1.12, 0.98);
      this.securityHubBoltMesh.userData = { interactableType: 'security_hub_door' };
      this.securityHubDoorPivot.add(this.securityHubBoltMesh);

      this.interactables.push(this.securityHubDoor);
      this.interactables.push(this.securityHubBoltMesh);

      // ====================================================================
      // 10. JENDELA KACA BURAM & PEMENTASAN BAYANGAN TIM "CODE 0" (TANPA 3D MESH MANUSIA)
      // ====================================================================
      const frostedGlassMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        emissive: 0x0f172a,
        emissiveIntensity: 0.45,
        roughness: 0.55,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72
      });
      const hubFrostedWindow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.45, 2.1), frostedGlassMat);
      hubFrostedWindow.position.set(-2.22, -2.35, 28.9);
      this.floorTwoGroup.add(hubFrostedWindow);

      // Siluet Bayangan Hitam Taktis (Shadow Planes/Decals) untuk Dhafir, Intan, Jack, dan Mike
      // Murni bidang siluet bayangan tanpa model 3D karakter manusia utuh
      const shadowSilhouetteCanvas = document.createElement('canvas');
      shadowSilhouetteCanvas.width = 128;
      shadowSilhouetteCanvas.height = 256;
      const sCtx = shadowSilhouetteCanvas.getContext('2d');
      sCtx.clearRect(0, 0, 128, 256);
      // Gambar siluet bayangan helm taktis, bahu, & laras senjata berperedam dalam profil hitam pekat
      sCtx.fillStyle = 'rgba(2, 6, 23, 0.92)';
      sCtx.beginPath();
      sCtx.arc(60, 48, 22, 0, Math.PI * 2); // siluet kepala/helm
      sCtx.fill();
      sCtx.fillRect(34, 70, 52, 110); // siluet torso taktis
      sCtx.fillRect(58, 86, 62, 14);  // siluet bayangan laras karabin
      const shadowSilTex = new THREE.CanvasTexture(shadowSilhouetteCanvas);

      for (let i = 0; i < 4; i++) {
        const silMat = new THREE.MeshBasicMaterial({
          map: shadowSilTex,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const silPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.65), silMat);
        silPlane.position.set(-2.12 + i * 0.03, -2.42 + (i % 2) * 0.08, 28.1 + i * 0.45);
        silPlane.rotation.y = -Math.PI / 2;
        this.floorTwoGroup.add(silPlane);
        this.code0ShadowSilhouettes.push({
          mesh: silPlane,
          mat: silMat,
          baseZ: 28.0 + i * 0.42,
          speed: 1.8 + i * 0.55,
          phase: i * 1.57
        });
      }

      // Kilatan Api Senjata (Muzzle Flash Point Lights) dari Mezzanine & Ujung Lorong Luar
      [
        [-1.6, -1.65, 28.5, 0xfbbf24],
        [0.8, -0.95, 30.8, 0x38bdf8],
        [-1.8, -2.15, 29.4, 0xf59e0b]
      ].forEach(([lx, ly, lz, col]) => {
        const mfLight = new THREE.PointLight(col, 0, 9.5, 1.5);
        mfLight.position.set(lx, ly, lz);
        this.floorTwoGroup.add(mfLight);
        this.code0MuzzleFlashLights.push(mfLight);
      });

      // ====================================================================
      // 11. KONSOL MONITOR CCTV TABUNG (KAMERA 4 LANTAI 2) & TUAS PEMUTUS DAYA SEKTOR 2
      // ====================================================================
      const consoleDeskGroup = new THREE.Group();
      consoleDeskGroup.position.set(-6.35, -4.2, 27.8);
      this.floorTwoGroup.add(consoleDeskGroup);

      const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.92, 3.4), steelMat);
      consoleBase.position.set(0, 0.46, 0);
      consoleBase.castShadow = true;
      consoleDeskGroup.add(consoleBase);

      // Tabung Monitor CCTV Utama (Menghadap ke Pemain di +x)
      const crtHousing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.86, 1.18), darkIronMat);
      crtHousing.position.set(0.05, 1.35, -0.35);
      consoleDeskGroup.add(crtHousing);

      this.cctvCam4Canvas = document.createElement('canvas');
      this.cctvCam4Canvas.width = 512;
      this.cctvCam4Canvas.height = 384;
      this.cctvCam4Ctx = this.cctvCam4Canvas.getContext('2d');
      // Tampilan awal standby sebelum Maya mengaktifkan layar CCTV di akhir Fase 3
      this.cctvCam4Ctx.fillStyle = '#090d16';
      this.cctvCam4Ctx.fillRect(0, 0, 512, 384);
      this.cctvCam4Ctx.fillStyle = '#475569';
      this.cctvCam4Ctx.font = 'bold 22px monospace';
      this.cctvCam4Ctx.fillText('CAM 04 - LANTAI 2 ATRIUM [STANDBY]', 38, 192);

      this.cctvCam4Texture = new THREE.CanvasTexture(this.cctvCam4Canvas);
      this.cctvCam4ScreenMat = new THREE.MeshBasicMaterial({
        map: this.cctvCam4Texture,
        color: 0x64748b
      });
      const crtScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.76), this.cctvCam4ScreenMat);
      crtScreenMesh.position.set(0.40, 1.35, -0.35);
      crtScreenMesh.rotation.y = Math.PI / 2;
      consoleDeskGroup.add(crtScreenMesh);

      this.cctvCam4GlowLight = new THREE.PointLight(0xe2e8f0, 0.15, 4.0, 1.8);
      this.cctvCam4GlowLight.position.set(-5.6, -2.8, 27.45);
      this.floorTwoGroup.add(this.cctvCam4GlowLight);

      // Model 3D Dr. Mark Evans Tergantung Lemas Terlilit Kabel & Tentakel Biomekanik di Tiang Lantai 2
      // Ditempatkan pada Viewport Kamera 4 / Proyeksi 3D di atas-belakang Monitor CCTV sehingga tampak nyata dalam 3D!
      this.markHostage3DGroup = new THREE.Group();
      this.markHostage3DGroup.position.set(-6.85, -2.55, 27.45);
      this.markHostage3DGroup.scale.set(0.55, 0.55, 0.55);
      this.markHostage3DGroup.visible = false;
      this.floorTwoGroup.add(this.markHostage3DGroup);

      // Tiang Struktur Lantai 2 tempat Dr. Mark Evans tergantung
      const markPillarMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.2, 12), concretePillarMat);
      markPillarMesh.position.set(0, 0, 0);
      this.markHostage3DGroup.add(markPillarMesh);

      // Tubuh 3D Dr. Mark Evans (Jas Lab Putih Kusam + Kepala Tertunduk + Lengan Terikat)
      const labCoatMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 });
      const markSkinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.75 });
      const tendrilBioMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.7,
        roughness: 0.35,
        metalness: 0.45
      });

      const markTorso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.68, 0.24), labCoatMat);
      markTorso.position.set(0.26, 0.08, 0);
      markTorso.rotation.z = -0.18;
      this.markHostage3DGroup.add(markTorso);

      const markHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), markSkinMat);
      markHead.position.set(0.32, 0.54, 0.04);
      this.markHostage3DGroup.add(markHead);

      // Drive Dekripsi Berkedip di Saku Jas Kiri Dr. Mark Evans
      const driveMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const decryptionDriveMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.06), driveMat);
      decryptionDriveMesh.position.set(0.46, 0.04, 0.10);
      this.markHostage3DGroup.add(decryptionDriveMesh);

      // Lilitan Kabel Saraf di Tengkuk & Tentakel Biomekanik Gelap yang Mengikat Tangan Kanan Mark
      for (let tIdx = 0; tIdx < 5; tIdx++) {
        const tendril = new THREE.Mesh(
          new THREE.TorusGeometry(0.34 + (tIdx % 2) * 0.05, 0.042, 8, 18),
          tendrilBioMat
        );
        tendril.position.set(0.12, -0.32 + tIdx * 0.22, 0);
        tendril.rotation.x = Math.PI / 2 + (tIdx - 2) * 0.18;
        this.markHostage3DGroup.add(tendril);
        this.markHostageTendrils.push(tendril);
        if (tIdx === 3) {
          this.markRightArmTendrilMesh = tendril;
        }
      }

      // Panel & Tuas Pemutus Daya Sektor 2 (Di sebelah kanan layar CCTV pada meja konsol: z = +0.75)
      const breakerPanelBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 0.58), darkIronMat);
      breakerPanelBox.name = 'powerBreakerLever';
      breakerPanelBox.position.set(0.18, 1.28, 0.78);
      breakerPanelBox.userData = { interactableType: 'sector2_breaker_lever', objectName: 'powerBreakerLever' };
      consoleDeskGroup.add(breakerPanelBox);

      this.sector2BreakerLEDMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const breakerStatusLED = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), this.sector2BreakerLEDMat);
      breakerStatusLED.position.set(0.41, 1.52, 0.78);
      consoleDeskGroup.add(breakerStatusLED);

      this.sector2BreakerHandlePivot = new THREE.Group();
      this.sector2BreakerHandlePivot.position.set(0.40, 1.28, 0.78);
      this.sector2BreakerHandlePivot.rotation.z = -0.45; // Posisi tuas atas (ON)
      consoleDeskGroup.add(this.sector2BreakerHandlePivot);

      const handleRedMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0x991b1b,
        emissiveIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.5
      });
      this.sector2BreakerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.26), handleRedMat);
      this.sector2BreakerMesh.name = 'powerBreakerLever';
      this.sector2BreakerMesh.position.set(0.14, 0, 0);
      this.sector2BreakerMesh.userData = { interactableType: 'sector2_breaker_lever', objectName: 'powerBreakerLever' };
      this.sector2BreakerHandlePivot.add(this.sector2BreakerMesh);

      this.interactables.push(breakerPanelBox);
      this.interactables.push(this.sector2BreakerMesh);

      this.sector2BreakerGlowLight = new THREE.PointLight(0xef4444, 0.25, 3.8, 1.8);
      this.sector2BreakerGlowLight.position.set(-5.75, -2.85, 28.58);
      this.floorTwoGroup.add(this.sector2BreakerGlowLight);

      // Partikel Percikan Api di Konsol Pemutus Daya Sektor 2 saat Tuas Ditarik
      const cSparkCount = 24;
      const cSparkPos = new Float32Array(cSparkCount * 3);
      for (let i = 0; i < cSparkCount; i++) {
        cSparkPos[i * 3 + 0] = -5.88 + (Math.random() - 0.5) * 0.35;
        cSparkPos[i * 3 + 1] = -2.92 + (Math.random() - 0.5) * 0.45;
        cSparkPos[i * 3 + 2] = 28.58 + (Math.random() - 0.5) * 0.35;
      }
      const cSparkGeo = new THREE.BufferGeometry();
      cSparkGeo.setAttribute('position', new THREE.BufferAttribute(cSparkPos, 3));
      this.consoleBreakerSparksMat = new THREE.PointsMaterial({
        color: 0xfbbf24,
        size: 0.065,
        transparent: true,
        opacity: 0.0
      });
      this.consoleBreakerSparksPoints = new THREE.Points(cSparkGeo, this.consoleBreakerSparksMat);
      this.floorTwoGroup.add(this.consoleBreakerSparksPoints);

      // ====================================================================
      // 12. PERLUASAN GEOMETRI LANTAI 1 (EXPANDED LEVEL DESIGN: z = +28.5 s/d +64.0, y = -4.2m)
      //     - Koridor Sayap Barat & Kargo (Cargo Hall: x = -10.5..+2.0, z = +28.5..+44.0)
      //     - Ruang Medis Darurat (Medical Bay: x = -16.5..-10.5, z = +33.0..+40.5)
      //     - Ruang Genset (Generator Room: x = -9.5..+2.0, z = +44.0..+54.5)
      //     - Atrium Konsol Gerbang Utama (Main Gate Hall: x = -8.5..+2.0, z = +54.5..+64.0)
      // ====================================================================
      const cargoPlateCanvas = document.createElement('canvas');
      cargoPlateCanvas.width = 128;
      cargoPlateCanvas.height = 128;
      const cpCtx = cargoPlateCanvas.getContext('2d');
      cpCtx.fillStyle = '#1e242b';
      cpCtx.fillRect(0, 0, 128, 128);
      cpCtx.strokeStyle = '#334155';
      cpCtx.lineWidth = 2;
      for (let py = 8; py < 128; py += 16) {
        for (let px = 8; px < 128; px += 16) {
          cpCtx.beginPath();
          cpCtx.moveTo(px - 4, py);
          cpCtx.lineTo(px, py - 4);
          cpCtx.lineTo(px + 4, py);
          cpCtx.lineTo(px, py + 4);
          cpCtx.closePath();
          cpCtx.stroke();
        }
      }
      const diamondPlateTex = new THREE.CanvasTexture(cargoPlateCanvas);
      diamondPlateTex.wrapS = THREE.RepeatWrapping;
      diamondPlateTex.wrapT = THREE.RepeatWrapping;
      diamondPlateTex.repeat.set(14, 24);

      const cargoFloorMat = new THREE.MeshStandardMaterial({
        map: diamondPlateTex,
        color: 0x262f3a,
        roughness: 0.55,
        metalness: 0.62
      });

      // A. KORIDOR SAYAP BARAT & KARGO (CARGO HALL: x = -10.5 s/d +2.0, z = +30.8 s/d +44.0)
      const cargoFloor = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.14, 13.6), cargoFloorMat);
      cargoFloor.position.set(-4.2, -4.26, 37.4);
      cargoFloor.receiveShadow = true;
      this.floorTwoGroup.add(cargoFloor);

      const cargoCeil = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.16, 13.6), coldStaffCeilMat);
      cargoCeil.position.set(-4.2, 0.25, 37.4);
      this.floorTwoGroup.add(cargoCeil);

      const cargoEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 13.6), coldStaffWallMat);
      cargoEastWall.position.set(2.1, -1.95, 37.4);
      this.floorTwoGroup.add(cargoEastWall);

      const cargoWestWallNorth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 4.8), coldStaffWallMat);
      cargoWestWallNorth.position.set(-10.5, -1.95, 33.1);
      this.floorTwoGroup.add(cargoWestWallNorth);

      const cargoWestWallSouth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.6, 6.0), coldStaffWallMat);
      cargoWestWallSouth.position.set(-10.5, -1.95, 41.0);
      this.floorTwoGroup.add(cargoWestWallSouth);

      const containerRedMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.65, metalness: 0.45 });
      const containerBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.65, metalness: 0.45 });
      const forkliftYellowMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.55 });

      const cargoContainer1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 4.6), containerRedMat);
      cargoContainer1.position.set(-6.8, -2.95, 34.8);
      cargoContainer1.castShadow = true;
      cargoContainer1.receiveShadow = true;
      this.floorTwoGroup.add(cargoContainer1);

      const cargoContainer2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 4.4), containerBlueMat);
      cargoContainer2.position.set(-1.2, -2.95, 39.8);
      cargoContainer2.castShadow = true;
      cargoContainer2.receiveShadow = true;
      this.floorTwoGroup.add(cargoContainer2);

      const forkliftGroup = new THREE.Group();
      forkliftGroup.position.set(-4.2, -4.2, 41.5);
      forkliftGroup.rotation.y = 0.35;
      const flBody = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 1.95), forkliftYellowMat);
      flBody.position.set(0, 0.62, 0);
      forkliftGroup.add(flBody);
      const flMast = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.05, 0.14), darkIronMat);
      flMast.position.set(0, 1.05, 1.02);
      forkliftGroup.add(flMast);
      this.floorTwoGroup.add(forkliftGroup);

      const cargoLight = new THREE.PointLight(0xf59e0b, 0.72, 12.0, 1.8);
      cargoLight.position.set(-4.2, -0.85, 37.2);
      this.floorTwoGroup.add(cargoLight);

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, 'CARGO HALL // WEST WING', -1.8, -1.45, 31.2, 0);
      this._createRoomNumberPlateForGroup(this.floorTwoGroup, '<- MEDICAL BAY', -10.35, -1.55, 36.75, Math.PI / 2);

      // AI Monster di Koridor Sayap Barat & Kargo (Fatal Gaze + Blink Active)
      this.westWingCargoEntity = createShadowRedEyesEntity(THREE);
      this.westWingCargoEntity.position.set(-4.2, -4.2, 38.5);
      this.westWingCargoEntity.visible = false;
      this.floorTwoGroup.add(this.westWingCargoEntity);

      // B. RUANG MEDIS DARURAT (MEDICAL BAY: x = -16.5 s/d -10.5, z = +33.0 s/d +40.5)
      const medFloorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.2 });
      const medFloor = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 7.5), medFloorMat);
      medFloor.position.set(-13.5, -4.26, 36.75);
      medFloor.receiveShadow = true;
      this.floorTwoGroup.add(medFloor);

      const medCeil = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 7.5), coldStaffCeilMat);
      medCeil.position.set(-13.5, -0.95, 36.75);
      this.floorTwoGroup.add(medCeil);

      const medBackWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.4, 7.5), coldStaffWallMat);
      medBackWall.position.set(-16.5, -2.55, 36.75);
      this.floorTwoGroup.add(medBackWall);

      const medNorthWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.4, 0.22), coldStaffWallMat);
      medNorthWall.position.set(-13.5, -2.55, 33.0);
      this.floorTwoGroup.add(medNorthWall);

      const medSouthWall = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.4, 0.22), coldStaffWallMat);
      medSouthWall.position.set(-13.5, -2.55, 40.5);
      this.floorTwoGroup.add(medSouthWall);

      const stretcherMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.6 });
      [-14.8, -12.4].forEach((sx, sIdx) => {
        const stretcher = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 2.05), stretcherMat);
        stretcher.position.set(sx, -3.84, 34.8 + sIdx * 3.4);
        stretcher.rotation.y = sIdx * 0.22;
        this.floorTwoGroup.add(stretcher);
      });

      const brokenCabinetGlassMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.38,
        roughness: 0.2
      });
      const medCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.85, 1.4), steelMat);
      medCabinet.position.set(-16.15, -3.25, 36.75);
      this.floorTwoGroup.add(medCabinet);
      const medGlassShard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 1.2), brokenCabinetGlassMat);
      medGlassShard.position.set(-15.9, -3.1, 36.75);
      medGlassShard.rotation.z = 0.14;
      this.floorTwoGroup.add(medGlassShard);

      const medLight = new THREE.PointLight(0x34d399, 0.75, 8.5, 1.8);
      medLight.position.set(-13.5, -1.25, 36.75);
      this.floorTwoGroup.add(medLight);

      // C. RUANG GENSET (GENERATOR ROOM: x = -9.5 s/d +2.0, z = +44.0 s/d +54.5, Bervolume Tinggi)
      const genRoomFloor = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.14, 10.6), cargoFloorMat);
      genRoomFloor.position.set(-3.75, -4.26, 49.3);
      genRoomFloor.receiveShadow = true;
      this.floorTwoGroup.add(genRoomFloor);

      const genRoomCeil = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.18, 10.6), coldStaffCeilMat);
      genRoomCeil.position.set(-3.75, 1.65, 49.3);
      this.floorTwoGroup.add(genRoomCeil);

      const genRoomWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.0, 10.6), coldStaffWallMat);
      genRoomWestWall.position.set(-9.5, -1.25, 49.3);
      this.floorTwoGroup.add(genRoomWestWall);

      const genRoomEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 6.0, 10.6), coldStaffWallMat);
      genRoomEastWall.position.set(2.1, -1.25, 49.3);
      this.floorTwoGroup.add(genRoomEastWall);

      const turbineGroup = new THREE.Group();
      turbineGroup.position.set(-6.5, -2.85, 49.2);
      this.floorTwoGroup.add(turbineGroup);

      const turbineBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 6.4), darkIronMat);
      turbineBase.position.set(0, -0.8, 0);
      turbineGroup.add(turbineBase);

      this.floor1TurbineRotor = new THREE.Group();
      this.floor1TurbineRotor.position.set(0, 0.25, 0);
      turbineGroup.add(this.floor1TurbineRotor);

      const rotorShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 5.8, 16), steelMat);
      rotorShaft.rotation.x = Math.PI / 2;
      this.floor1TurbineRotor.add(rotorShaft);

      for (let b = 0; b < 6; b++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.14, 5.2), exposedHingeMat);
        blade.rotation.z = (b * Math.PI) / 6;
        this.floor1TurbineRotor.add(blade);
      }

      this.floor1SteamGroup = new THREE.Group();
      this.floor1SteamGroup.position.set(-4.6, -3.2, 47.5);
      const steamMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1, transparent: true, opacity: 0.28 });
      for (let sp = 0; sp < 6; sp++) {
        const steamPuff = new THREE.Mesh(new THREE.SphereGeometry(0.24 + sp * 0.06, 8, 8), steamMat);
        steamPuff.position.set((Math.random() - 0.5) * 0.5, sp * 0.28, (Math.random() - 0.5) * 0.5);
        this.floor1SteamGroup.add(steamPuff);
      }
      this.floorTwoGroup.add(this.floor1SteamGroup);

      const genRoomLight = new THREE.PointLight(0x38bdf8, 0.95, 13.0, 1.7);
      genRoomLight.position.set(-2.5, 0.4, 49.3);
      this.floorTwoGroup.add(genRoomLight);

      this._createRoomNumberPlateForGroup(this.floorTwoGroup, 'GENERATOR TURBINE HALL', -2.2, -1.35, 44.2, 0);

      // D. ATRIUM KONSOL GERBANG UTAMA (MAIN GATE HALL: x = -8.5 s/d +2.0, z = +54.5 s/d +64.0)
      const gateHallFloor = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 9.6), coldDryFloorMat);
      gateHallFloor.position.set(-3.25, -4.26, 59.3);
      gateHallFloor.receiveShadow = true;
      this.floorTwoGroup.add(gateHallFloor);

      const gateHallCeil = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.16, 9.6), coldStaffCeilMat);
      gateHallCeil.position.set(-3.25, 0.85, 59.3);
      this.floorTwoGroup.add(gateHallCeil);

      const gateHallWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.2, 9.6), coldStaffWallMat);
      gateHallWestWall.position.set(-8.5, -1.65, 59.3);
      this.floorTwoGroup.add(gateHallWestWall);

      const gateHallEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.2, 9.6), coldStaffWallMat);
      gateHallEastWall.position.set(2.1, -1.65, 59.3);
      this.floorTwoGroup.add(gateHallEastWall);

      const gateConsoleGroup = new THREE.Group();
      gateConsoleGroup.position.set(-3.2, -4.2, 61.2);
      this.floorTwoGroup.add(gateConsoleGroup);

      const gateConsolePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.12, 0.85), steelMat);
      gateConsolePedestal.position.set(0, 0.56, 0);
      gateConsoleGroup.add(gateConsolePedestal);

      const gateConsoleScreenMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      this.mainGateConsoleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.55), gateConsoleScreenMat);
      this.mainGateConsoleMesh.name = 'mainGateConsole';
      this.mainGateConsoleMesh.position.set(0, 1.22, 0);
      this.mainGateConsoleMesh.userData = { interactableType: 'main_gate_console' };
      gateConsoleGroup.add(this.mainGateConsoleMesh);
      this.interactables.push(this.mainGateConsoleMesh);

      this.mainArmoredGateLeft = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.28), darkIronMat);
      this.mainArmoredGateLeft.position.set(-4.5, -2.3, 63.6);
      this.mainArmoredGateLeft.userData = { interactableType: 'main_gate_console' };
      this.floorTwoGroup.add(this.mainArmoredGateLeft);
      this.interactables.push(this.mainArmoredGateLeft);

      this.mainArmoredGateRight = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.28), darkIronMat);
      this.mainArmoredGateRight.position.set(-1.9, -2.3, 63.6);
      this.mainArmoredGateRight.userData = { interactableType: 'main_gate_console' };
      this.floorTwoGroup.add(this.mainArmoredGateRight);
      this.interactables.push(this.mainArmoredGateRight);

      const gateBeaconLight = new THREE.PointLight(0x22c55e, 1.45, 12.0, 1.6);
      gateBeaconLight.position.set(-3.2, -1.8, 61.2);
      this.floorTwoGroup.add(gateBeaconLight);

      // ====================================================================
      // 13. AREA EKSTRAKSI LUAR GERBANG, KENDARAAN TAKTIS LAPIS BAJA (APC),
      //     TIM CODE 0 BERTOPENG BALAKLAVA VISOR GELAP, & 4 MODEL 3D WARGA SELAMAT
      // ====================================================================
      const extRoadMat = new THREE.MeshStandardMaterial({
        color: 0x11161d,
        roughness: 0.85,
        metalness: 0.15
      });
      const extRoadFloor = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.16, 16.0), extRoadMat);
      extRoadFloor.position.set(-3.2, -4.27, 71.0);
      extRoadFloor.receiveShadow = true;
      this.floorTwoGroup.add(extRoadFloor);

      // Lapisan Kabut Luar Gerbang (Fog Planes)
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      [65.2, 71.5, 75.8].forEach((mz, mIdx) => {
        const mistPlane = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 4.2), mistMat);
        mistPlane.position.set(-3.2, -2.2 + mIdx * 0.15, mz);
        this.floorTwoGroup.add(mistPlane);
      });

      // Helper Pembuat Anggota Tim "Code 0" (Seragam Tempur Hitam + Balaklava Balistik + Visor Reflektif Gelap)
      // Wajah 100% tertutup misterius tanpa memperlihatkan kulit/wajah
      const tacticalSuitMat = new THREE.MeshStandardMaterial({
        color: 0x090c10,
        roughness: 0.68,
        metalness: 0.25
      });
      const armorVestMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.45,
        metalness: 0.65
      });
      const balaclavaMat = new THREE.MeshStandardMaterial({
        color: 0x05070a,
        roughness: 0.82,
        metalness: 0.12
      });
      const reflectiveVisorMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0x082f49,
        emissiveIntensity: 0.38,
        roughness: 0.06,
        metalness: 0.96
      });

      // Tekstur Kerutan Kain & Serat Kasa Realistis (Anti-Stickman High-Fidelity)
      const wrinkledFabricCanvas = document.createElement('canvas');
      wrinkledFabricCanvas.width = 128;
      wrinkledFabricCanvas.height = 128;
      const wfCtx = wrinkledFabricCanvas.getContext('2d');
      wfCtx.fillStyle = '#cbd5e1';
      wfCtx.fillRect(0, 0, 128, 128);
      for (let w = 0; w < 36; w++) {
        wfCtx.strokeStyle = (w % 2 === 0) ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.22)';
        wfCtx.lineWidth = 2;
        wfCtx.beginPath();
        wfCtx.moveTo(0, w * 4);
        wfCtx.quadraticCurveTo(64, w * 4 + ((w % 3) - 1) * 6, 128, w * 4);
        wfCtx.stroke();
      }
      const wrinkledClothTex = new THREE.CanvasTexture(wrinkledFabricCanvas);

      // Standar Visual Anti-Stickman 2: Tim Code 0 (Seragam Tempur Modern Elit Serba Hitam:
      // Tactical Plate Carrier MOLLE, Shoulder Pads, Knee-Pads, Combat Boots, Helm Balistik FAST
      // dengan NVG Mount Terangkat, Balaklava Tertutup Penuh, dan Kacamata Taktis Anti-Refleksi)
      const createCode0Operative = (nameLabel, isStanding = false) => {
        const opGroup = new THREE.Group();
        opGroup.name = nameLabel;

        // Sepatu Tempur (Combat Boots) + Pelindung Lutut (Knee-Pads) + Paha & Betis Proporsional
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.65, metalness: 0.35 });
        const kneePadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.7 });
        const legH = isStanding ? 0.44 : 0.30;
        [-0.13, 0.13].forEach((lx) => {
          const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.076, legH, 12), tacticalSuitMat);
          thigh.position.set(lx, isStanding ? 0.66 : 0.48, isStanding ? 0 : 0.10);
          opGroup.add(thigh);

          const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.16), kneePadMat);
          kneePad.position.set(lx, isStanding ? 0.45 : 0.34, isStanding ? 0.04 : 0.18);
          opGroup.add(kneePad);

          const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.064, legH, 12), tacticalSuitMat);
          calf.position.set(lx, isStanding ? 0.26 : 0.20, isStanding ? 0 : 0.14);
          opGroup.add(calf);

          const combatBoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.26), bootMat);
          combatBoot.position.set(lx, 0.07, isStanding ? 0.04 : 0.18);
          opGroup.add(combatBoot);
        });

        // Panggul, Sabuk Taktis (Duty Belt), & Dada Anatomis
        const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.25), armorVestMat);
        pelvis.position.set(0, isStanding ? 0.92 : 0.62, 0);
        opGroup.add(pelvis);

        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.56, 14), tacticalSuitMat);
        torso.position.set(0, isStanding ? 1.24 : 0.90, 0);
        opGroup.add(torso);

        // Tactical Plate Carrier MOLLE + Magazin Pouches
        const plateCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.30), armorVestMat);
        plateCarrier.position.set(0, isStanding ? 1.25 : 0.92, 0);
        opGroup.add(plateCarrier);

        [-0.13, 0.0, 0.13].forEach((mx) => {
          const mollePouch = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.06), kneePadMat);
          mollePouch.position.set(mx, isStanding ? 1.15 : 0.82, 0.17);
          opGroup.add(mollePouch);
        });

        // Bahu Taktis (Shoulder Pads) & Lengan Berartikulasi Siku
        [-0.29, 0.29].forEach((sx, sIdx) => {
          const shoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.10, 12, 10), armorVestMat);
          shoulderPad.position.set(sx, isStanding ? 1.44 : 1.10, 0);
          opGroup.add(shoulderPad);
        });

        const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.54, 12), tacticalSuitMat);
        leftArm.position.set(-0.31, isStanding ? 1.18 : 0.84, 0.04);
        opGroup.add(leftArm);

        const rightArmPivot = new THREE.Group();
        rightArmPivot.position.set(0.31, isStanding ? 1.42 : 1.08, 0.04);
        const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.54, 12), tacticalSuitMat);
        rightArm.position.set(0, -0.24, 0);
        rightArmPivot.add(rightArm);
        opGroup.add(rightArmPivot);

        // Leher & Kepala Balaklava Penuh + Helm Balistik FAST + NVG Mount Terangkat + Kacamata Taktis Anti-Refleksi
        const headY = isStanding ? 1.68 : 1.34;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.12, 12), balaclavaMat);
        neck.position.set(0, headY - 0.14, 0);
        opGroup.add(neck);

        const balaclavaHead = new THREE.Mesh(new THREE.SphereGeometry(0.155, 16, 16), balaclavaMat);
        balaclavaHead.position.set(0, headY, 0);
        opGroup.add(balaclavaHead);

        const fastHelmet = new THREE.Mesh(new THREE.SphereGeometry(0.168, 16, 12), armorVestMat);
        fastHelmet.position.set(0, headY + 0.03, -0.01);
        opGroup.add(fastHelmet);

        // NVG Mount Terangkat (Quad-Tube Night Vision Goggles di Dahi Helm)
        const nvgMountBracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), kneePadMat);
        nvgMountBracket.position.set(0, headY + 0.12, 0.14);
        opGroup.add(nvgMountBracket);
        [-0.07, -0.025, 0.025, 0.07].forEach((nx) => {
          const nvgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.11, 10), bootMat);
          nvgTube.rotation.x = Math.PI / 3;
          nvgTube.position.set(nx, headY + 0.16, 0.17);
          opGroup.add(nvgTube);
        });

        // Kacamata Taktis Anti-Refleksi Gelap
        const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.095, 0.15), bootMat);
        goggleFrame.position.set(0, headY + 0.01, 0.09);
        opGroup.add(goggleFrame);
        const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.075, 0.16), reflectiveVisorMat);
        visorMesh.position.set(0, headY + 0.01, 0.095);
        opGroup.add(visorMesh);

        return { group: opGroup, rightArmPivot };
      };

      // Kendaraan Taktis Lapis Baja (APC / Tactical Van) di Luar Gerbang Utama (x = -3.2, y = -4.2, z = +68.4)
      this.tacticalApcGroup = new THREE.Group();
      this.tacticalApcGroup.position.set(-3.2, -4.2, 68.4);
      this.floorTwoGroup.add(this.tacticalApcGroup);

      const apcBodyMat = new THREE.MeshStandardMaterial({
        color: 0x0f141c,
        roughness: 0.48,
        metalness: 0.78
      });
      const apcInteriorMat = new THREE.MeshStandardMaterial({
        color: 0x1e2530,
        roughness: 0.75,
        metalness: 0.35
      });

      const apcFloor = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.18, 6.2), apcInteriorMat);
      apcFloor.position.set(0, 0.36, 0);
      this.tacticalApcGroup.add(apcFloor);

      const apcRoof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.16, 6.2), apcBodyMat);
      apcRoof.position.set(0, 2.52, 0);
      this.tacticalApcGroup.add(apcRoof);

      const apcLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 6.2), apcBodyMat);
      apcLeftWall.position.set(-1.48, 1.44, 0);
      this.tacticalApcGroup.add(apcLeftWall);

      const apcRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 6.2), apcBodyMat);
      apcRightWall.position.set(1.48, 1.44, 0);
      this.tacticalApcGroup.add(apcRightWall);

      const apcFrontBulkhead = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 0.18), apcBodyMat);
      apcFrontBulkhead.position.set(0, 1.44, 3.05);
      this.tacticalApcGroup.add(apcFrontBulkhead);

      const tireMat = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: 0.9 });
      [
        [-1.58, 0.48, -2.0],
        [1.58, 0.48, -2.0],
        [-1.58, 0.48, 2.0],
        [1.58, 0.48, 2.0]
      ].forEach(([tx, ty, tz]) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.34, 16), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(tx, ty, tz);
        this.tacticalApcGroup.add(tire);
      });

      const benchLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 4.2), armorVestMat);
      benchLeft.position.set(-1.12, 0.62, -0.4);
      this.tacticalApcGroup.add(benchLeft);

      const benchRight = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 4.2), armorVestMat);
      benchRight.position.set(1.12, 0.62, -0.4);
      this.tacticalApcGroup.add(benchRight);

      this.apcRearDoorLeftPivot = new THREE.Group();
      this.apcRearDoorLeftPivot.position.set(-1.45, 0.42, -3.08);
      this.apcRearDoorLeftPivot.rotation.y = -Math.PI * 0.62;
      this.tacticalApcGroup.add(this.apcRearDoorLeftPivot);

      const rearDoorLeftMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.05, 0.12), apcBodyMat);
      rearDoorLeftMesh.position.set(0.71, 1.02, 0);
      rearDoorLeftMesh.userData = { interactableType: 'tactical_apc_entry' };
      this.apcRearDoorLeftPivot.add(rearDoorLeftMesh);
      this.interactables.push(rearDoorLeftMesh);

      this.apcRearDoorRightPivot = new THREE.Group();
      this.apcRearDoorRightPivot.position.set(1.45, 0.42, -3.08);
      this.apcRearDoorRightPivot.rotation.y = Math.PI * 0.62;
      this.tacticalApcGroup.add(this.apcRearDoorRightPivot);

      const rearDoorRightMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.05, 0.12), apcBodyMat);
      rearDoorRightMesh.position.set(-0.71, 1.02, 0);
      rearDoorRightMesh.userData = { interactableType: 'tactical_apc_entry' };
      this.apcRearDoorRightPivot.add(rearDoorRightMesh);
      this.interactables.push(rearDoorRightMesh);

      this.apcRearWindowMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.78
      });
      const apcRearWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.68), this.apcRearWindowMat);
      apcRearWindow.position.set(0, 1.78, -3.02);
      this.tacticalApcGroup.add(apcRearWindow);

      const apcCabinLight = new THREE.PointLight(0x38bdf8, 0.95, 6.5, 1.6);
      apcCabinLight.position.set(0, 2.28, 0);
      this.tacticalApcGroup.add(apcCabinLight);

      this.apcBlastFlashLight = new THREE.PointLight(0xffaa33, 0.0, 18.0, 1.2);
      this.apcBlastFlashLight.position.set(0, 1.85, -3.4);
      this.tacticalApcGroup.add(this.apcBlastFlashLight);

      const dhafirOp = createCode0Operative('Code0_Dhafir', true);
      this.dhafirApcMesh = dhafirOp.group;
      this.dhafirGestureArmPivot = dhafirOp.rightArmPivot;
      this.dhafirApcMesh.position.set(0.95, 0.0, -3.55);
      this.dhafirApcMesh.rotation.y = Math.PI;
      this.tacticalApcGroup.add(this.dhafirApcMesh);

      const jackOp = createCode0Operative('Code0_Jack', false);
      this.jackApcMesh = jackOp.group;
      this.jackApcMesh.position.set(-0.92, 0.42, 1.75);
      this.jackApcMesh.rotation.y = Math.PI * 0.45;
      const detonatorBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.09, 0.20),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      detonatorBox.position.set(0.28, 0.88, 0.18);
      this.jackApcMesh.add(detonatorBox);
      this.tacticalApcGroup.add(this.jackApcMesh);

      const intanOp = createCode0Operative('Code0_Intan', false);
      intanOp.group.position.set(0.92, 0.42, 1.85);
      intanOp.group.rotation.y = -Math.PI * 0.45;
      this.tacticalApcGroup.add(intanOp.group);

      const mikeOp = createCode0Operative('Code0_Mike', false);
      mikeOp.group.position.set(0.92, 0.42, 0.85);
      mikeOp.group.rotation.y = -Math.PI * 0.5;
      this.tacticalApcGroup.add(mikeOp.group);

      // Standar Visual Anti-Stickman 3: Para Penyintas dengan Tekstur Pakaian Kain Berkerut & Perban Realistis
      const civSkinMat = new THREE.MeshStandardMaterial({ color: 0xd6b49c, roughness: 0.72 });
      const jacketMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0x475569, roughness: 0.82 });
      const workerSuitMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0x1e3a5f, roughness: 0.78 });
      const bloodBandageMat = new THREE.MeshStandardMaterial({
        map: wrinkledClothTex,
        color: 0xf8fafc,
        emissive: 0x991b1b,
        emissiveIntensity: 0.42,
        roughness: 0.65
      });
      const childHoodieMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0x9a3412, roughness: 0.8 });
      const plushToyMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });
      const silverThermalMat = new THREE.MeshStandardMaterial({
        map: wrinkledClothTex,
        color: 0xe2e8f0,
        roughness: 0.18,
        metalness: 0.92
      });

      // Warga 1: Wanita Dewasa (Anatomi utuh + jaket berkerut + animasi getar bahu)
      this.civWomanGroup = new THREE.Group();
      this.civWomanGroup.position.set(-0.98, 0.42, -0.35);
      this.civWomanGroup.rotation.y = Math.PI / 2;
      this.civWomanShoulders = new THREE.Group();
      const womanTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.54, 14), jacketMat);
      womanTorso.position.set(0, 0.74, 0);
      womanTorso.rotation.x = 0.22;
      this.civWomanShoulders.add(womanTorso);
      [-0.10, 0.10].forEach((lx) => {
        const wLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.056, 0.46, 10), jacketMat);
        wLeg.position.set(lx, 0.34, 0.12);
        this.civWomanGroup.add(wLeg);
      });
      const womanHead = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 16), civSkinMat);
      womanHead.position.set(0, 1.12, 0.06);
      this.civWomanShoulders.add(womanHead);
      const clutchedJacket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.18), jacketMat);
      clutchedJacket.position.set(0, 0.76, 0.16);
      this.civWomanShoulders.add(clutchedJacket);
      this.civWomanGroup.add(this.civWomanShoulders);
      this.tacticalApcGroup.add(this.civWomanGroup);

      // Warga 2: Pria Dewasa Pekerja Fasilitas (Anatomi utuh + perban berdarah realistis di lengan)
      this.civWorkerGroup = new THREE.Group();
      this.civWorkerGroup.position.set(0.98, 0.42, -0.25);
      this.civWorkerGroup.rotation.y = -Math.PI / 2;
      const workerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.60, 14), workerSuitMat);
      workerTorso.position.set(0, 0.78, 0);
      this.civWorkerGroup.add(workerTorso);
      [-0.11, 0.11].forEach((lx) => {
        const wkLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.48, 10), workerSuitMat);
        wkLeg.position.set(lx, 0.34, 0.12);
        this.civWorkerGroup.add(wkLeg);
      });
      const workerHead = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 16), civSkinMat);
      workerHead.position.set(0, 1.20, 0);
      this.civWorkerGroup.add(workerHead);
      const workerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.055, 0.48, 12), workerSuitMat);
      workerArm.position.set(-0.27, 0.76, 0.06);
      this.civWorkerGroup.add(workerArm);
      const armBandage = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.22, 14), bloodBandageMat);
      armBandage.position.set(-0.27, 0.74, 0.06);
      this.civWorkerGroup.add(armBandage);
      this.tacticalApcGroup.add(this.civWorkerGroup);

      // Warga 3: Anak-anak (Proporsi kecil + hoodie berkerut + memeluk boneka)
      this.civChildGroup = new THREE.Group();
      this.civChildGroup.position.set(-0.98, 0.42, -1.25);
      this.civChildGroup.rotation.y = Math.PI / 2;
      this.civChildGroup.scale.set(0.66, 0.66, 0.66);
      const childTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.48, 14), childHoodieMat);
      childTorso.position.set(0, 0.72, 0);
      childTorso.rotation.x = 0.28;
      this.civChildGroup.add(childTorso);
      const childHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), civSkinMat);
      childHead.position.set(0, 1.06, 0.08);
      this.civChildGroup.add(childHead);
      const plushDoll = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), plushToyMat);
      plushDoll.position.set(0, 0.76, 0.18);
      this.civChildGroup.add(plushDoll);
      this.tacticalApcGroup.add(this.civChildGroup);

      // Warga 4: Lansia (Membungkuk + selimut termal perak berkerut)
      this.civElderlyGroup = new THREE.Group();
      this.civElderlyGroup.position.set(0.98, 0.42, -1.25);
      this.civElderlyGroup.rotation.y = -Math.PI / 2;
      const elderlyThermalBlanket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.58, 14), silverThermalMat);
      elderlyThermalBlanket.position.set(0, 0.74, 0.04);
      elderlyThermalBlanket.rotation.x = 0.32;
      this.civElderlyGroup.add(elderlyThermalBlanket);
      const elderlyHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), civSkinMat);
      elderlyHead.position.set(0, 1.10, 0.14);
      this.civElderlyGroup.add(elderlyHead);
      this.tacticalApcGroup.add(this.civElderlyGroup);

      // ====================================================================
      // 14. POS PENGAWASAN PERBATASAN: KAMAR RAWAT MEDIS, LORONG SAYAP MEDIS,
      //     PINTU GESER OTOMATIS, & RUANG ARSIP PROYEKTOR PNG 512x512 (y = +20.0m)
      // ====================================================================
      this.hospitalRoomGroup = new THREE.Group();
      this.hospitalRoomGroup.position.set(0, 20.0, 0);
      this.hospitalRoomGroup.visible = false;
      this.rootScene.add(this.hospitalRoomGroup);

      const hospWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42, metalness: 0.06 });
      const hospFloorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.32, metalness: 0.10 });
      const hospSheetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55 });
      const hospBlanketMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.6 });

      // Lantai & Langit-Langit Kamar Rawat (z = +2.2 s/d -3.2)
      const hospFloor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 5.6), hospFloorMat);
      hospFloor.position.set(0, -0.07, -0.5);
      this.hospitalRoomGroup.add(hospFloor);

      const hospCeil = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 5.6), hospWallMat);
      hospCeil.position.set(0, 3.2, -0.5);
      this.hospitalRoomGroup.add(hospCeil);

      const hospBackWall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.3, 0.18), hospWallMat);
      hospBackWall.position.set(0, 1.6, 2.2);
      this.hospitalRoomGroup.add(hospBackWall);

      // Dinding Depan Kamar Rawat (z = -3.2) memiliki bukaan tengah lebar (x: -1.1..+1.1) menuju Lorong Sayap Medis
      const hospFrontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.3, 0.18), hospWallMat);
      hospFrontWallLeft.position.set(-2.15, 1.6, -3.2);
      this.hospitalRoomGroup.add(hospFrontWallLeft);

      const hospFrontWallRight = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.3, 0.18), hospWallMat);
      hospFrontWallRight.position.set(2.15, 1.6, -3.2);
      this.hospitalRoomGroup.add(hospFrontWallRight);

      const hospLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.3, 5.6), hospWallMat);
      hospLeftWall.position.set(-2.8, 1.6, -0.5);
      this.hospitalRoomGroup.add(hospLeftWall);

      const hospRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.3, 5.6), hospWallMat);
      hospRightWall.position.set(2.8, 1.6, -0.5);
      this.hospitalRoomGroup.add(hospRightWall);

      // Jendela Kamar Rumah Sakit dengan Gorden Tersibak & Langit Pagi Cerah
      const brightSkyMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
      const hospWindowSky = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.65), brightSkyMat);
      hospWindowSky.position.set(2.68, 1.75, -0.8);
      hospWindowSky.rotation.y = -Math.PI / 2;
      this.hospitalRoomGroup.add(hospWindowSky);

      const hospCurtainMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0xf1f5f9, roughness: 0.7 });
      this.hospitalCurtainLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.42), hospCurtainMat);
      this.hospitalCurtainLeft.position.set(2.62, 1.72, -1.75);
      this.hospitalRoomGroup.add(this.hospitalCurtainLeft);

      this.hospitalCurtainRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.42), hospCurtainMat);
      this.hospitalCurtainRight.position.set(2.62, 1.72, 0.15);
      this.hospitalRoomGroup.add(this.hospitalCurtainRight);

      // Ranjang Medis Tempat Maya Berbaring
      const hospBedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.58, 2.25), hospSheetMat);
      hospBedFrame.position.set(0, 0.29, -0.15);
      this.hospitalRoomGroup.add(hospBedFrame);

      const hospBlanket = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.14, 1.45), hospBlanketMat);
      hospBlanket.position.set(0, 0.62, -0.45);
      this.hospitalRoomGroup.add(hospBlanket);

      // Tiang Infus (IV Stand) & Monitor Detak Jantung di Samping Ranjang
      const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 1.85, 10), steelMat);
      ivPole.position.set(-0.88, 0.92, 0.15);
      this.hospitalRoomGroup.add(ivPole);

      const ivBag = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.22, 0.06),
        new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.75 })
      );
      ivBag.position.set(-0.88, 1.68, 0.15);
      this.hospitalRoomGroup.add(ivBag);

      const ecgBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.32), hospWallMat);
      ecgBox.position.set(-0.95, 1.12, -0.45);
      this.hospitalRoomGroup.add(ecgBox);
      const ecgScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.22),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      ecgScreen.position.set(-0.73, 1.12, -0.45);
      ecgScreen.rotation.y = Math.PI / 2;
      this.hospitalRoomGroup.add(ecgScreen);

      const hospAmbient = new THREE.PointLight(0xffffff, 1.65, 16.0, 1.2);
      hospAmbient.position.set(0, 2.8, -0.4);
      this.hospitalRoomGroup.add(hospAmbient);

      const hospSunlight = new THREE.PointLight(0xe0f2fe, 1.85, 14.0, 1.2);
      hospSunlight.position.set(2.2, 1.9, -0.8);
      this.hospitalRoomGroup.add(hospSunlight);

      // ====================================================================
      // STANDAR VISUAL ANTI-STICKMAN 1: MODEL 3D HIGH-FIDELITY DR. MARK EVANS
      // Anatomi proporsional pria dewasa: kemeja formal berdasi, jas lab terbuka berkerut,
      // celana bahan rapi, sepatu pantofel, dan perban kasa medis melingkar tipis di lehernya.
      // ====================================================================
      this.hospitalMarkGroup = new THREE.Group();
      this.hospitalMarkGroup.position.set(1.05, 0, -0.35);
      this.hospitalMarkGroup.rotation.y = -Math.PI * 0.62;
      this.hospitalRoomGroup.add(this.hospitalMarkGroup);

      const chairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.48), steelMat);
      chairMesh.position.set(1.05, 0.22, -0.35);
      this.hospitalRoomGroup.add(chairMesh);

      const neatShirtMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0xdbeafe, roughness: 0.58 });
      const labCoatOpenMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0xf8fafc, roughness: 0.62 });
      const tieFormalMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 });
      const slacksMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0x1e293b, roughness: 0.72 });
      const dressShoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.28, metalness: 0.35 });
      const gauzeBandageMat = new THREE.MeshStandardMaterial({ map: wrinkledClothTex, color: 0xffffff, roughness: 0.75 });

      // Kaki Kiri & Kanan Berartikulasi (Celana Bahan Rapi + Sepatu Pantofel)
      this.markLeftLegPivot = new THREE.Group();
      this.markLeftLegPivot.position.set(-0.11, 0.86, 0);
      const mLeftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.070, 0.44, 14), slacksMat);
      mLeftThigh.position.set(0, -0.22, 0);
      this.markLeftLegPivot.add(mLeftThigh);
      const mLeftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.42, 14), slacksMat);
      mLeftCalf.position.set(0, -0.62, 0);
      this.markLeftLegPivot.add(mLeftCalf);
      const mLeftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.24), dressShoeMat);
      mLeftShoe.position.set(0, -0.82, 0.05);
      this.markLeftLegPivot.add(mLeftShoe);
      this.hospitalMarkGroup.add(this.markLeftLegPivot);

      this.markRightLegPivot = new THREE.Group();
      this.markRightLegPivot.position.set(0.11, 0.86, 0);
      const mRightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.070, 0.44, 14), slacksMat);
      mRightThigh.position.set(0, -0.22, 0);
      this.markRightLegPivot.add(mRightThigh);
      const mRightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.42, 14), slacksMat);
      mRightCalf.position.set(0, -0.62, 0);
      this.markRightLegPivot.add(mRightCalf);
      const mRightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.24), dressShoeMat);
      mRightShoe.position.set(0, -0.82, 0.05);
      this.markRightLegPivot.add(mRightShoe);
      this.hospitalMarkGroup.add(this.markRightLegPivot);

      // Panggul, Kemeja Formal Berdasi, & Jas Lab Terbuka yang Berkerut
      const markPelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.18, 14), slacksMat);
      markPelvis.position.set(0, 0.90, 0);
      this.hospitalMarkGroup.add(markPelvis);

      const markShirtTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.18, 0.56, 16), neatShirtMat);
      markShirtTorso.position.set(0, 1.24, 0);
      this.hospitalMarkGroup.add(markShirtTorso);

      // Dasi Formal di Dada Kemeja
      const markTie = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.38, 0.025), tieFormalMat);
      markTie.position.set(0, 1.26, 0.195);
      this.hospitalMarkGroup.add(markTie);

      // Jas Lab Putih Terbuka (Panel Kiri, Panel Kanan, Punggung, & Kerah Lapel)
      const coatBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.78, 0.06), labCoatOpenMat);
      coatBack.position.set(0, 1.12, -0.17);
      this.hospitalMarkGroup.add(coatBack);
      [-0.15, 0.15].forEach((cx) => {
        const coatFrontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.08), labCoatOpenMat);
        coatFrontPanel.position.set(cx, 1.12, 0.17);
        this.hospitalMarkGroup.add(coatFrontPanel);
        const coatSidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 0.34), labCoatOpenMat);
        coatSidePanel.position.set(cx * 1.45, 1.12, 0);
        this.hospitalMarkGroup.add(coatSidePanel);
      });

      // Lengan Kiri & Kanan Berartikulasi (Lengan Jas Lab + Tangan)
      this.markLeftArmPivot = new THREE.Group();
      this.markLeftArmPivot.position.set(-0.28, 1.46, 0);
      const mLeftSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.055, 0.52, 12), labCoatOpenMat);
      mLeftSleeve.position.set(0, -0.24, 0);
      this.markLeftArmPivot.add(mLeftSleeve);
      const mLeftHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), civSkinMat);
      mLeftHand.position.set(0, -0.52, 0);
      this.markLeftArmPivot.add(mLeftHand);
      this.hospitalMarkGroup.add(this.markLeftArmPivot);

      this.markRightArmPivot = new THREE.Group();
      this.markRightArmPivot.position.set(0.28, 1.46, 0);
      const mRightSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.055, 0.52, 12), labCoatOpenMat);
      mRightSleeve.position.set(0, -0.24, 0);
      this.markRightArmPivot.add(mRightSleeve);
      const mRightHand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), civSkinMat);
      mRightHand.position.set(0, -0.52, 0);
      this.markRightArmPivot.add(mRightHand);
      this.hospitalMarkGroup.add(this.markRightArmPivot);

      // Leher & Perban Kasa Medis Melingkar Tipis di Leher Dr. Mark Evans
      const markNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.14, 14), civSkinMat);
      markNeck.position.set(0, 1.56, 0);
      this.hospitalMarkGroup.add(markNeck);

      const neckBandage = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.082, 0.085, 16), gauzeBandageMat);
      neckBandage.position.set(0, 1.55, 0);
      this.hospitalMarkGroup.add(neckBandage);

      // Kepala, Rambut, Hidung, Mata, & Senyum Tipis Dr. Mark Evans
      this.hospitalMarkHead = new THREE.Group();
      this.hospitalMarkHead.position.set(0, 1.72, 0.01);
      const markFaceSphere = new THREE.Mesh(new THREE.SphereGeometry(0.142, 18, 18), civSkinMat);
      this.hospitalMarkHead.add(markFaceSphere);

      const markNose = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.055, 8), civSkinMat);
      markNose.rotation.x = Math.PI / 2;
      markNose.position.set(0, -0.005, 0.148);
      this.hospitalMarkHead.add(markNose);

      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 });
      const markHair = new THREE.Mesh(new THREE.SphereGeometry(0.148, 16, 12), hairMat);
      markHair.position.set(0, 0.038, -0.018);
      this.hospitalMarkHead.add(markHair);

      const eyeDarkMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      [-0.046, 0.046].forEach((ex) => {
        const eyeDot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), eyeDarkMat);
        eyeDot.position.set(ex, 0.02, 0.134);
        this.hospitalMarkHead.add(eyeDot);
      });
      const subtleSmile = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 6, 12, Math.PI), eyeDarkMat);
      subtleSmile.position.set(0, -0.035, 0.135);
      subtleSmile.rotation.x = Math.PI + 0.15;
      this.hospitalMarkHead.add(subtleSmile);

      this.hospitalMarkGroup.add(this.hospitalMarkHead);

      // ====================================================================
      // 15. LORONG SAYAP MEDIS STERIL (z = -3.2 s/d -14.5), PINTU GESER OTOMATIS,
      //     & RUANG ARSIP PENGAWASAN PERBATASAN (z = -14.5 s/d -23.5)
      // ====================================================================
      const medCorridorFloor = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 11.4), hospFloorMat);
      medCorridorFloor.position.set(0, -0.07, -8.9);
      this.hospitalRoomGroup.add(medCorridorFloor);

      const medCorridorCeil = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 11.4), hospWallMat);
      medCorridorCeil.position.set(0, 3.2, -8.9);
      this.hospitalRoomGroup.add(medCorridorCeil);

      const medCorridorLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.3, 11.4), hospWallMat);
      medCorridorLeftWall.position.set(-2.2, 1.6, -8.9);
      this.hospitalRoomGroup.add(medCorridorLeftWall);

      const medCorridorRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.3, 11.4), hospWallMat);
      medCorridorRightWall.position.set(2.2, 1.6, -8.9);
      this.hospitalRoomGroup.add(medCorridorRightWall);

      const medCorridorLight = new THREE.PointLight(0xf8fafc, 1.45, 14.0, 1.4);
      medCorridorLight.position.set(0, 2.9, -9.0);
      this.hospitalRoomGroup.add(medCorridorLight);

      // Pintu Geser Otomatis Koridor Medis menuju Ruang Arsip Perbatasan (z = -14.5)
      const slideDoorMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.25,
        metalness: 0.72
      });
      this.medicalSlidingDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.65, 0.10), slideDoorMat);
      this.medicalSlidingDoorLeft.position.set(-0.58, 1.32, -14.5);
      this.hospitalRoomGroup.add(this.medicalSlidingDoorLeft);

      this.medicalSlidingDoorRight = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.65, 0.10), slideDoorMat);
      this.medicalSlidingDoorRight.position.set(0.58, 1.32, -14.5);
      this.hospitalRoomGroup.add(this.medicalSlidingDoorRight);

      // Ruang Arsip & Pengawasan Perbatasan (x = -4.8..+4.8, z = -14.5..-23.5)
      const archiveOutpostFloor = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.14, 9.2), hospFloorMat);
      archiveOutpostFloor.position.set(0, -0.07, -19.0);
      this.hospitalRoomGroup.add(archiveOutpostFloor);

      const archiveOutpostCeil = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.14, 9.2), hospWallMat);
      archiveOutpostCeil.position.set(0, 3.4, -19.0);
      this.hospitalRoomGroup.add(archiveOutpostCeil);

      const archiveBackWall = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.5, 0.18), hospWallMat);
      archiveBackWall.position.set(0, 1.7, -23.5);
      this.hospitalRoomGroup.add(archiveBackWall);

      const archiveLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.5, 9.2), hospWallMat);
      archiveLeftWall.position.set(-4.8, 1.7, -19.0);
      this.hospitalRoomGroup.add(archiveLeftWall);

      const archiveRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.5, 9.2), hospWallMat);
      archiveRightWall.position.set(4.8, 1.7, -19.0);
      this.hospitalRoomGroup.add(archiveRightWall);

      const archiveLight = new THREE.PointLight(0xe0f2fe, 1.55, 16.0, 1.3);
      archiveLight.position.set(0, 3.0, -19.0);
      this.hospitalRoomGroup.add(archiveLight);

      // Papan Proyektor Digital Utama (Menampilkan 5 Foto Konspirasi 512x512 PNG dari Direktori Root)
      const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(3.05, 3.05, 0.12), darkIronMat);
      screenFrame.position.set(0, 1.75, -23.25);
      this.hospitalRoomGroup.add(screenFrame);

      this.archiveProjectorMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.archiveProjectorScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 2.85), this.archiveProjectorMat);
      this.archiveProjectorScreenMesh.position.set(0, 1.75, -23.17);
      this.hospitalRoomGroup.add(this.archiveProjectorScreenMesh);

      // Panel Bukti Sekunder di Samping Proyektor (Menampilkan Kartu Identitas Dr. Mark Evans photo_mark_evans.png)
      const markCardMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.archiveSecondaryMarkCardMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.35), markCardMat);
      this.archiveSecondaryMarkCardMesh.position.set(-2.55, 1.72, -23.17);
      this.hospitalRoomGroup.add(this.archiveSecondaryMarkCardMesh);

      // Jendela Panorama Fajar Pangkalan Perbatasan di Dinding Kanan Ruang Arsip (x = +4.68, z = -19.2)
      const dawnHorizonCanvas = document.createElement('canvas');
      dawnHorizonCanvas.width = 256;
      dawnHorizonCanvas.height = 256;
      const dhCtx = dawnHorizonCanvas.getContext('2d');
      const dhGrad = dhCtx.createLinearGradient(0, 0, 0, 256);
      dhGrad.addColorStop(0.0, '#38bdf8');
      dhGrad.addColorStop(0.55, '#bae6fd');
      dhGrad.addColorStop(0.82, '#fde68a');
      dhGrad.addColorStop(1.0, '#f59e0b');
      dhCtx.fillStyle = dhGrad;
      dhCtx.fillRect(0, 0, 256, 256);
      const dawnHorizonTex = new THREE.CanvasTexture(dawnHorizonCanvas);
      this.outpostDawnWindowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 1.95),
        new THREE.MeshBasicMaterial({ map: dawnHorizonTex })
      );
      this.outpostDawnWindowMesh.position.set(4.68, 1.82, -19.2);
      this.outpostDawnWindowMesh.rotation.y = -Math.PI / 2;
      this.hospitalRoomGroup.add(this.outpostDawnWindowMesh);

      // Unit Radio HT Kecil di Saku/Tangan Maya (Muncul saat Refleksi Terakhir Maya)
      this.mayaPocketRadioMesh = new THREE.Group();
      const epilogueHtBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.045), darkIronMat);
      this.mayaPocketRadioMesh.add(epilogueHtBody);
      const epilogueHtAnt = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.14, 8), darkIronMat);
      epilogueHtAnt.position.set(0.028, 0.14, 0);
      this.mayaPocketRadioMesh.add(epilogueHtAnt);
      const epilogueHtLed = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      epilogueHtLed.position.set(-0.02, 0.065, 0.025);
      this.mayaPocketRadioMesh.add(epilogueHtLed);
      this.mayaPocketRadioMesh.position.set(0.22, -0.24, -0.45);
      this.mayaPocketRadioMesh.rotation.set(0.25, -0.35, 0.1);
      this.mayaPocketRadioMesh.visible = false;
      if (this.game && this.game.camera) {
        this.game.camera.add(this.mayaPocketRadioMesh);
      }
    }

    _createRoomNumberPlateForGroup(group, roomNumberStr, x, y, z, rotY) {
      const THREE = window.THREE;
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#233028';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#84a98c';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 120, 56);
      ctx.fillStyle = '#e2f1e7';
      ctx.font = 'bold 30px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomNumberStr, 64, 34);
      const tex = new THREE.CanvasTexture(canvas);
      const plateMat = new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0x14241b,
        emissiveMap: tex,
        emissiveIntensity: 0.5
      });
      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.018), plateMat);
      plateMesh.position.set(x, y, z);
      plateMesh.rotation.y = rotY;
      group.add(plateMesh);
    }

    _buildEastWingAndInteractiveDoors() {
      const THREE = window.THREE;

      const eastFloor = new THREE.Mesh(
        new THREE.BoxGeometry(11.3, 0.1, 2.9),
        this.corridorFloorMat
      );
      eastFloor.position.set(16.9, -0.05, -13.6);
      eastFloor.receiveShadow = true;
      this.scene.add(eastFloor);

      const eastCeiling = new THREE.Mesh(
        new THREE.BoxGeometry(11.3, 0.1, 2.9),
        this.corridorCeilingMat
      );
      eastCeiling.position.set(16.9, 3.05, -13.6);
      this.scene.add(eastCeiling);

      const eastNorthWall1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.05, 0.18), this.corridorWallMat);
      eastNorthWall1.position.set(12.85, 1.5, -15.0);
      eastNorthWall1.receiveShadow = true;
      this.scene.add(eastNorthWall1);

      const room304Header = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.88, 0.18), this.corridorWallMat);
      room304Header.position.set(14.8, 2.58, -15.0);
      this.scene.add(room304Header);

      const eastNorthWall2 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.05, 0.18), this.corridorWallMat);
      eastNorthWall2.position.set(18.85, 1.5, -15.0);
      eastNorthWall2.receiveShadow = true;
      this.scene.add(eastNorthWall2);

      const eastSouthWall = new THREE.Mesh(new THREE.BoxGeometry(8.3, 3.05, 0.18), this.corridorWallMat);
      eastSouthWall.position.set(15.5, 1.5, -12.2);
      eastSouthWall.receiveShadow = true;
      this.scene.add(eastSouthWall);

      const farEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 8.2), this.corridorWallMat);
      farEastWall.position.set(22.4, 1.5, -11.0);
      farEastWall.receiveShadow = true;
      this.scene.add(farEastWall);

      this._addBaseboard(12.85, -14.89, 2.8, 'x');
      this._addBaseboard(18.85, -14.89, 7.0, 'x');
      this._addBaseboard(15.5, -12.31, 8.1, 'x');
      this._addBaseboard(22.29, -11.0, 8.0, 'z');

      const r304JambL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), this.darkWoodMat);
      r304JambL.position.set(14.3, 1.09, -15.0);
      this.scene.add(r304JambL);

      const r304JambR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), this.darkWoodMat);
      r304JambR.position.set(15.3, 1.09, -15.0);
      this.scene.add(r304JambR);

      this.room304DoorPivot = new THREE.Group();
      this.room304DoorPivot.position.set(14.34, 0, -15.02);
      this.room304DoorPivot.rotation.y = 0.62;
      this.scene.add(this.room304DoorPivot);

      const r304DoorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 2.12, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x3b261a, roughness: 0.78 })
      );
      r304DoorMesh.position.set(0.46, 1.06, 0);
      r304DoorMesh.castShadow = true;
      r304DoorMesh.receiveShadow = true;
      r304DoorMesh.userData = { interactableType: 'room_304_door' };
      this.room304DoorPivot.add(r304DoorMesh);
      this.interactables.push(r304DoorMesh);

      this._createRoomNumberPlate('304', 14.02, 1.62, -14.89, 0);

      const r305Group = this._createHallwayDoorMesh(15.2, -12.29, Math.PI, 'room_305_knock', 'Kamar 305');
      this.scene.add(r305Group);
      this._createRoomNumberPlate('305', 14.48, 1.62, -12.31, Math.PI);

      this.room307DoorGroup = this._createHallwayDoorMesh(19.0, -14.91, 0, 'room_307_knock', 'Kamar 307');
      this.scene.add(this.room307DoorGroup);
      this._createRoomNumberPlate('307', 18.28, 1.62, -14.89, 0);

      const eastWingLight = new THREE.PointLight(0x9cb4c9, 0.85, 14.0, 2);
      eastWingLight.position.set(15.8, 2.82, -13.6);
      this.scene.add(eastWingLight);
    }

    _createHallwayDoorMesh(x, z, rotY, interactableType, roomLabel) {
      const THREE = window.THREE;
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotY;

      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.06, 2.18, 0.08), this.darkWoodMat);
      frame.position.set(0, 1.09, 0);
      group.add(frame);

      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.92, 2.1, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x321f15, roughness: 0.82 })
      );
      panel.position.set(0, 1.06, 0.02);
      panel.castShadow = true;
      panel.receiveShadow = true;
      panel.userData = { interactableType, roomLabel };
      group.add(panel);

      this.interactables.push(panel);
      return group;
    }

    _buildRoom304Interior() {
      const THREE = window.THREE;

      const rFloor = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.1, 4.2), this.corridorFloorMat);
      rFloor.position.set(14.8, -0.05, -17.0);
      rFloor.receiveShadow = true;
      this.scene.add(rFloor);

      const rCeil = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.1, 4.2), this.corridorCeilingMat);
      rCeil.position.set(14.8, 3.05, -17.0);
      this.scene.add(rCeil);

      const rBackWall = new THREE.Mesh(new THREE.BoxGeometry(5.1, 3.05, 0.18), this.corridorWallMat);
      rBackWall.position.set(14.8, 1.5, -19.0);
      rBackWall.receiveShadow = true;
      this.scene.add(rBackWall);

      const rLeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 4.2), this.corridorWallMat);
      rLeftWall.position.set(12.3, 1.5, -17.0);
      rLeftWall.receiveShadow = true;
      this.scene.add(rLeftWall);

      const rRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 4.2), this.corridorWallMat);
      rRightWall.position.set(17.3, 1.5, -17.0);
      rRightWall.receiveShadow = true;
      this.scene.add(rRightWall);

      this._addBaseboard(14.8, -18.89, 5.0, 'x');
      this._addBaseboard(12.41, -17.0, 4.0, 'z');
      this._addBaseboard(17.19, -17.0, 4.0, 'z');

      // Ranjang Usang di Sisi Kiri
      const oldBedGroup = new THREE.Group();
      oldBedGroup.position.set(13.15, 0, -17.1);

      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 2.05), this.darkWoodMat);
      bedFrame.position.set(0, 0.16, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      oldBedGroup.add(bedFrame);

      const bedHeadboard = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.92, 0.1), this.darkWoodMat);
      bedHeadboard.position.set(0, 0.46, -0.98);
      bedHeadboard.rotation.z = -0.04;
      oldBedGroup.add(bedHeadboard);

      const tornMattressMat = new THREE.MeshStandardMaterial({
        color: 0x48403c,
        roughness: 0.94,
        metalness: 0.02
      });
      const tornMattress = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.2, 1.92), tornMattressMat);
      tornMattress.position.set(0.03, 0.40, 0.02);
      tornMattress.rotation.z = 0.03;
      tornMattress.castShadow = true;
      oldBedGroup.add(tornMattress);

      const foamTear = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.06, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x7a6842, roughness: 0.96 })
      );
      foamTear.position.set(0.15, 0.50, 0.2);
      foamTear.rotation.y = 0.4;
      oldBedGroup.add(foamTear);

      this.scene.add(oldBedGroup);

      // Meja Kerja Kayu Reyot & Cermin Retak di Sudut Depan
      const deskGroup = new THREE.Group();
      deskGroup.position.set(15.85, 0, -18.35);

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 0.74), this.darkWoodMat);
      deskTop.position.set(0, 0.76, 0);
      deskTop.rotation.z = -0.015;
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      deskGroup.add(deskTop);

      const legGeo = new THREE.BoxGeometry(0.07, 0.75, 0.07);
      [
        [-0.58, 0.375, -0.28],
        [0.58, 0.375, -0.28],
        [-0.58, 0.375, 0.28],
        [0.58, 0.375, 0.28]
      ].forEach(([lx, ly, lz], idx) => {
        const leg = new THREE.Mesh(legGeo, this.darkWoodMat);
        leg.position.set(lx, ly, lz);
        if (idx === 2) leg.rotation.z = 0.05;
        deskGroup.add(leg);
      });

      this.scene.add(deskGroup);

      const mirrorTex = this._createCrackedMirrorTexture();
      const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 1.15, 0.05), this.darkWoodMat);
      mirrorFrame.position.set(15.85, 1.52, -18.88);
      this.scene.add(mirrorFrame);

      const mirrorGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 1.02),
        new THREE.MeshStandardMaterial({
          map: mirrorTex,
          roughness: 0.22,
          metalness: 0.86
        })
      );
      mirrorGlass.position.set(15.85, 1.52, -18.85);
      this.scene.add(mirrorGlass);

      // Tumpukan Kardus Basah & Sampah
      const wetCardboardMat = new THREE.MeshStandardMaterial({
        color: 0x4a3828,
        roughness: 0.92,
        metalness: 0.02
      });
      const trashBagMat = new THREE.MeshStandardMaterial({
        color: 0x16181c,
        roughness: 0.48,
        metalness: 0.25
      });

      const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.5), wetCardboardMat);
      box1.position.set(16.65, 0.21, -15.65);
      box1.rotation.y = 0.35;
      box1.castShadow = true;
      this.scene.add(box1);

      const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.42), wetCardboardMat);
      box2.position.set(16.58, 0.58, -15.72);
      box2.rotation.set(0.08, -0.5, 0.12);
      box2.castShadow = true;
      this.scene.add(box2);

      const trashBag1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), trashBagMat);
      trashBag1.scale.set(1.1, 0.85, 1.0);
      trashBag1.position.set(16.25, 0.22, -15.55);
      this.scene.add(trashBag1);

      const trashBag2 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), trashBagMat);
      trashBag2.scale.set(1.0, 0.78, 1.15);
      trashBag2.position.set(12.85, 0.19, -15.55);
      this.scene.add(trashBag2);

      // Kunci Ruang Panel 3B / Maintenance 3B (stairwellKeyMesh) + Label Tag di Atas Meja Kerja
      this.stairwellKeyMesh = new THREE.Group();
      this.stairwellKeyMesh.position.set(15.85, 0.815, -18.22);
      this.stairwellKeyMesh.rotation.y = -0.55;

      const keyMetalMat = new THREE.MeshStandardMaterial({
        color: 0xd8c26c,
        emissive: 0x443510,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.94
      });

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 12), keyMetalMat);
      shaft.rotation.z = Math.PI / 2;
      shaft.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(shaft);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.01, 10, 18), keyMetalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-0.10, 0, 0);
      ring.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(ring);

      // Gantungan Tag Kunci "PANEL 3B"
      const keyTag = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.008, 0.032),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 })
      );
      keyTag.position.set(-0.15, 0, 0.01);
      keyTag.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(keyTag);

      const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.042), keyMetalMat);
      teeth.position.set(0.06, 0, 0.022);
      teeth.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(teeth);

      const keyHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.24, 0.34),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      keyHitbox.userData = { interactableType: 'stairwell_key' };
      this.stairwellKeyMesh.add(keyHitbox);

      const glintCount = 14;
      const glintPositions = new Float32Array(glintCount * 3);
      for (let i = 0; i < glintCount; i++) {
        glintPositions[i * 3 + 0] = (Math.random() - 0.5) * 0.22;
        glintPositions[i * 3 + 1] = 0.02 + Math.random() * 0.14;
        glintPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.22;
      }
      const glintGeo = new THREE.BufferGeometry();
      glintGeo.setAttribute('position', new THREE.BufferAttribute(glintPositions, 3));
      this.keyGlintMat = new THREE.PointsMaterial({
        color: 0xfff4b8,
        size: 0.032,
        transparent: true,
        opacity: 0.65
      });
      this.keyGlintPoints = new THREE.Points(glintGeo, this.keyGlintMat);
      this.stairwellKeyMesh.add(this.keyGlintPoints);

      this.scene.add(this.stairwellKeyMesh);
      this.interactables.push(shaft, ring, keyTag, teeth, keyHitbox);

      // Wujud Baru Entitas di Kamar 304: Bayangan Hitam Pekat dengan Sepasang Mata Merah Menyala
      this.roomEntityMesh = createShadowRedEyesEntity(THREE);
      this.roomEntityMesh.position.set(14.85, 0, -16.25);
      this.roomEntityHeadWorldPos = new THREE.Vector3(14.85, 2.06, -16.25);
      this.roomEntityMesh.visible = false;
      this.scene.add(this.roomEntityMesh);

      const r304Light = new THREE.PointLight(0xd99b66, 0.68, 8.5, 2);
      r304Light.position.set(14.8, 2.75, -17.2);
      this.scene.add(r304Light);
    }

    _createCrackedMirrorTexture() {
      const THREE = window.THREE;
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 256, 256);
      grad.addColorStop(0, '#1e2630');
      grad.addColorStop(0.5, '#2b3542');
      grad.addColorStop(1, '#12171d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = 'rgba(210, 225, 240, 0.65)';
      ctx.lineWidth = 1.8;
      const cx = 148;
      const cy = 112;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 7) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = cx + Math.cos(a) * 60 + (Math.random() - 0.5) * 18;
        const my = cy + Math.sin(a) * 60 + (Math.random() - 0.5) * 18;
        ctx.lineTo(mx, my);
        ctx.lineTo(cx + Math.cos(a + 0.1) * 145, cy + Math.sin(a + 0.1) * 145);
        ctx.stroke();
      }
      return new THREE.CanvasTexture(c);
    }

    _buildBarricadedStairwell() {
      const THREE = window.THREE;

      const stairFloor = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 5.4), this.corridorFloorMat);
      stairFloor.position.set(21.0, -0.05, -9.6);
      stairFloor.receiveShadow = true;
      this.scene.add(stairFloor);

      const stairCeil = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.1, 5.4), this.corridorCeilingMat);
      stairCeil.position.set(21.0, 3.05, -9.6);
      this.scene.add(stairCeil);

      const stairWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.05, 5.4), this.corridorWallMat);
      stairWestWall.position.set(19.6, 1.5, -9.6);
      stairWestWall.receiveShadow = true;
      this.scene.add(stairWestWall);

      const stairSouthWall = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.05, 0.18), this.corridorWallMat);
      stairSouthWall.position.set(21.0, 1.5, -7.0);
      this.scene.add(stairSouthWall);

      this._addBaseboard(19.71, -9.6, 5.2, 'z');

      const barricadeGroup = new THREE.Group();
      barricadeGroup.position.set(21.0, 0, -8.8);

      const tornMattress = new THREE.Mesh(
        new THREE.BoxGeometry(1.55, 1.85, 0.24),
        new THREE.MeshStandardMaterial({ color: 0x524642, roughness: 0.92 })
      );
      tornMattress.position.set(-0.35, 0.9, 0.1);
      tornMattress.rotation.set(-0.22, 0.18, 0.12);
      tornMattress.castShadow = true;
      tornMattress.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(tornMattress);

      const bloodPatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.76, 0.86, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x450606, roughness: 0.7 })
      );
      bloodPatch.position.set(-0.28, 0.85, 0.12);
      bloodPatch.rotation.set(-0.22, 0.18, 0.12);
      bloodPatch.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(bloodPatch);

      const tiltedWardrobe = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.82, 0.75), this.darkWoodMat);
      tiltedWardrobe.position.set(0.25, 0.45, -0.15);
      tiltedWardrobe.rotation.set(0.1, -0.25, 0.28);
      tiltedWardrobe.castShadow = true;
      tiltedWardrobe.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(tiltedWardrobe);

      for (let i = 0; i < 4; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 0.08), this.darkWoodMat);
        plank.position.set(0, 0.45 + i * 0.42, 0.25 - (i % 2) * 0.12);
        plank.rotation.z = (i % 2 === 0 ? 1 : -1) * (0.14 + i * 0.05);
        plank.castShadow = true;
        plank.userData = { interactableType: 'barricaded_stairs' };
        barricadeGroup.add(plank);
      }

      const barbedWireMat = new THREE.MeshStandardMaterial({
        color: 0x4a201a,
        roughness: 0.42,
        metalness: 0.82
      });
      for (let w = -0.75; w <= 0.75; w += 0.5) {
        const wireCoil = new THREE.Mesh(
          new THREE.TorusKnotGeometry(0.28, 0.018, 48, 8, 2, 3),
          barbedWireMat
        );
        wireCoil.position.set(w, 0.75, 0.32);
        wireCoil.userData = { interactableType: 'barricaded_stairs' };
        barricadeGroup.add(wireCoil);
      }

      const stairHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.4, 1.25),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      stairHitbox.position.set(0, 1.2, 0.25);
      stairHitbox.userData = { interactableType: 'barricaded_stairs' };
      barricadeGroup.add(stairHitbox);

      this.scene.add(barricadeGroup);
      this.interactables.push(tornMattress, bloodPatch, tiltedWardrobe, stairHitbox);
    }

    _buildConsoleTableAndFallingVase() {
      const THREE = window.THREE;

      const consoleTable = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.76, 0.38), this.darkWoodMat);
      consoleTable.position.set(17.6, 0.38, -12.46);
      consoleTable.castShadow = true;
      consoleTable.receiveShadow = true;
      this.scene.add(consoleTable);

      const ceramicMat = new THREE.MeshStandardMaterial({
        color: 0x9aa4ad,
        roughness: 0.32,
        metalness: 0.18
      });
      this.vaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.28, 14), ceramicMat);
      this.vaseMesh.position.set(17.6, 0.90, -12.52);
      this.vaseMesh.castShadow = true;
      this.scene.add(this.vaseMesh);

      this.vaseShardsGroup = new THREE.Group();
      this.vaseShardsGroup.position.set(17.6, 0.02, -12.92);
      for (let i = 0; i < 9; i++) {
        const shard = new THREE.Mesh(
          new THREE.ConeGeometry(0.045 + Math.random() * 0.03, 0.03, 4),
          ceramicMat
        );
        const angle = (i / 9) * Math.PI * 2;
        const dist = 0.06 + Math.random() * 0.22;
        shard.position.set(Math.cos(angle) * dist, 0.01, Math.sin(angle) * dist);
        shard.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
        this.vaseShardsGroup.add(shard);
      }
      this.vaseShardsGroup.visible = false;
      this.scene.add(this.vaseShardsGroup);
    }

    _buildCeilingPipesDuctsAndVents() {
      const THREE = window.THREE;

      const westDuct = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 11.6), this.ductMetalMat);
      westDuct.position.set(-0.75, 2.86, -8.8);
      this.scene.add(westDuct);

      const eastDuct = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.26, 0.48), this.ductMetalMat);
      eastDuct.position.set(11.2, 2.86, -14.35);
      this.scene.add(eastDuct);

      const pipeGeoWest = new THREE.CylinderGeometry(0.045, 0.045, 11.8, 10);
      const westPipe = new THREE.Mesh(pipeGeoWest, this.ductMetalMat);
      westPipe.rotation.x = Math.PI / 2;
      westPipe.position.set(0.88, 2.88, -8.9);
      this.scene.add(westPipe);

      const ventMat = new THREE.MeshStandardMaterial({
        color: 0x1b1e22,
        roughness: 0.5,
        metalness: 0.75
      });
      [
        [-0.75, 2.73, -6.0],
        [-0.75, 2.73, -11.5],
        [4.2, 2.72, -14.35],
        [8.8, 2.72, -14.35],
        [16.5, 2.72, -14.35]
      ].forEach(([vx, vy, vz]) => {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.03, 0.54), ventMat);
        vent.position.set(vx, vy, vz);
        this.scene.add(vent);
      });

      const cableMat = new THREE.MeshBasicMaterial({ color: 0x0c0e12 });
      const cableAnchors = [
        [new THREE.Vector3(-0.9, 2.95, -5.2), new THREE.Vector3(0.1, 2.48, -6.0), new THREE.Vector3(0.9, 2.95, -6.8)],
        [new THREE.Vector3(-0.9, 2.95, -10.2), new THREE.Vector3(-0.1, 2.42, -11.0), new THREE.Vector3(0.9, 2.95, -11.6)],
        [new THREE.Vector3(3.2, 3.15, -11.8), new THREE.Vector3(4.8, 2.58, -12.6), new THREE.Vector3(6.4, 3.15, -13.2)],
        [new THREE.Vector3(13.5, 2.95, -12.5), new THREE.Vector3(15.0, 2.46, -13.5), new THREE.Vector3(16.6, 2.95, -14.5)]
      ];

      cableAnchors.forEach((pts) => {
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, 14, 0.014, 6, false);
        const cableMesh = new THREE.Mesh(tubeGeo, cableMat);
        this.scene.add(cableMesh);
      });
    }

    /**
     * 3 & 4. Membangun Pintu Besi "BASEMENT ACCESS - GENERATOR", Tangga Menurun Bawah Tanah,
     *        dan Ruang Generator Basement (12m x 10m di y = -4.4m) + Tuas Manual & Entitas Dash
     */
    _buildBasementStairwellAndMachineRoom() {
      const THREE = window.THREE;

      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x282d33,
        roughness: 0.48,
        metalness: 0.78
      });

      const oilyFloorMat = new THREE.MeshStandardMaterial({
        map: this.corridorFloorMat.map,
        color: 0x202328,
        roughness: 0.45,
        metalness: 0.22,
        side: THREE.DoubleSide
      });

      // ====================================================================
      // A. PINTU BESI TEBAL "BASEMENT ACCESS - GENERATOR" (x = 3.9, z = -22.6)
      //    Daun pintu diayunkan penuh ke samping kanan dalam Ruang Panel 3B
      //    sehingga mulut lubang tangga (x = 3.0 s/d 4.8) terbuka 100% bebas hambatan!
      // ====================================================================
      this.basementDoorPivot = new THREE.Group();
      this.basementDoorPivot.position.set(4.78, 0, -22.52);
      this.basementDoorPivot.rotation.y = Math.PI * 0.48;
      this.scene.add(this.basementDoorPivot);

      const bDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.98, 2.22, 0.07), steelMat);
      bDoorMesh.position.set(0.49, 1.11, 0);
      bDoorMesh.castShadow = true;
      bDoorMesh.userData = { interactableType: 'basement_access_door' };
      this.basementDoorPivot.add(bDoorMesh);

      // Pelat Tulisan "BASEMENT ACCESS - GENERATOR"
      const bSignCanvas = document.createElement('canvas');
      bSignCanvas.width = 512;
      bSignCanvas.height = 160;
      const bctx = bSignCanvas.getContext('2d');
      bctx.fillStyle = '#1b1917';
      bctx.fillRect(0, 0, 512, 160);
      bctx.strokeStyle = '#d97706';
      bctx.lineWidth = 8;
      bctx.strokeRect(8, 8, 496, 144);
      bctx.fillStyle = '#fef3c7';
      bctx.font = 'bold 30px "Share Tech Mono", monospace';
      bctx.textAlign = 'center';
      bctx.fillText('BASEMENT ACCESS', 256, 66);
      bctx.fillStyle = '#f59e0b';
      bctx.font = 'bold 26px "Share Tech Mono", monospace';
      bctx.fillText('EMERGENCY GENERATOR', 256, 114);

      const bSignTex = new THREE.CanvasTexture(bSignCanvas);
      const bSignMat = new THREE.MeshStandardMaterial({
        map: bSignTex,
        emissive: 0x332006,
        emissiveMap: bSignTex,
        emissiveIntensity: 0.65,
        roughness: 0.4
      });
      const bSignMesh = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.24, 0.02), bSignMat);
      bSignMesh.position.set(0.49, 1.48, 0.045);
      bSignMesh.userData = { interactableType: 'basement_access_door' };
      this.basementDoorPivot.add(bSignMesh);
      this.interactables.push(bDoorMesh, bSignMesh);

      // Pelat di atas kusen pintu Basement Access
      const headerSign = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.03), bSignMat);
      headerSign.position.set(3.9, 2.48, -22.49);
      this.scene.add(headerSign);

      // ====================================================================
      // B. TANGGA BETON/BESI TERBUKA DENGAN PIJAKAN JELAS (TREADS & RISERS)
      // Flight 1: z = -22.6 s/d -28.6 (turun dari y = 0.0 ke y = -2.2m)
      // Bordes Tengah: z = -28.6 s/d -30.4 (datar bebas hambatan di y = -2.2m)
      // Flight 2: z = -30.4 s/d -36.4 (turun dari y = -2.2m ke y = -4.4m)
      // ====================================================================
      const stairWidth = 1.76;
      const treadMat = new THREE.MeshStandardMaterial({
        color: 0x2b3036,
        roughness: 0.68,
        metalness: 0.28
      });
      const riserMat = new THREE.MeshStandardMaterial({
        color: 0x1b1e23,
        roughness: 0.82,
        metalness: 0.18
      });
      const nosingMat = new THREE.MeshStandardMaterial({
        color: 0x85682a,
        emissive: 0x261c08,
        emissiveIntensity: 0.35,
        roughness: 0.45,
        metalness: 0.65
      });

      // 12 anak tangga pada Flight 1 (treads + risers + nosing strip jelas)
      for (let i = 0; i < 12; i++) {
        const sz = -22.6 - (i + 0.5) * 0.5;
        const sy = -((i + 1) / 12) * 2.2;
        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.48), treadMat);
        tread.position.set(3.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.scene.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), nosingMat);
        nosing.position.set(3.9, sy - 0.012, sz - 0.22);
        this.scene.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.185, 0.04), riserMat);
        riser.position.set(3.9, sy + 0.09, sz + 0.22);
        this.scene.add(riser);
      }

      // Bordes Tengah Bebas Hambatan (z = -28.6 s/d -30.4, y = -2.2m)
      const midLanding = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.16, 1.88), treadMat);
      midLanding.position.set(3.9, -2.28, -29.5);
      midLanding.receiveShadow = true;
      this.scene.add(midLanding);

      // 12 anak tangga pada Flight 2 (treads + risers + nosing strip jelas)
      for (let i = 0; i < 12; i++) {
        const sz = -30.4 - (i + 0.5) * 0.5;
        const sy = -2.2 - ((i + 1) / 12) * 2.2;
        const tread = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.05, 0.48), treadMat);
        tread.position.set(3.9, sy - 0.025, sz);
        tread.receiveShadow = true;
        this.scene.add(tread);

        const nosing = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.028, 0.045), nosingMat);
        nosing.position.set(3.9, sy - 0.012, sz - 0.22);
        this.scene.add(nosing);

        const riser = new THREE.Mesh(new THREE.BoxGeometry(stairWidth, 0.185, 0.04), riserMat);
        riser.position.set(3.9, sy + 0.09, sz + 0.22);
        this.scene.add(riser);
      }

      // Pegangan Besi (Handrail) di Dinding Kiri & Kanan Tangga
      [-0.82, 0.82].forEach((offsetX) => {
        const rail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.4, 8), steelMat);
        rail1.rotation.x = Math.PI / 2 - 0.35;
        rail1.position.set(3.9 + offsetX, -0.2, -25.6);
        this.scene.add(rail1);

        const rail2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 6.4, 8), steelMat);
        rail2.rotation.x = Math.PI / 2 - 0.35;
        rail2.position.set(3.9 + offsetX, -2.4, -33.4);
        this.scene.add(rail2);
      });

      // Dinding Kiri & Kanan Terowongan Tangga (x = 2.95 dan x = 4.85, z = -22.6 s/d -36.4)
      const stairWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 8.2, 14.0), this.corridorWallMat);
      stairWallLeft.position.set(2.95, -1.0, -29.5);
      this.scene.add(stairWallLeft);

      const stairWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 8.2, 14.0), this.corridorWallMat);
      stairWallRight.position.set(4.85, -1.0, -29.5);
      this.scene.add(stairWallRight);

      const stairCeiling = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 14.2), this.corridorCeilingMat);
      stairCeiling.position.set(3.9, 3.0, -29.5);
      this.scene.add(stairCeiling);

      // ====================================================================
      // C. RUANG GENERATOR BASEMENT (THE MACHINE ROOM — 12m x 10m di y = -4.4m)
      // Koordinat: x dari -2.1 s/d +9.9 (12.0m), z dari -36.4 s/d -46.4 (10.0m),
      // Lantai di y = -4.4m, Plafon di y = -0.6m (Tinggi 3.8m)
      // ====================================================================
      const bFloor = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.15, 10.2), oilyFloorMat);
      bFloor.position.set(3.9, -4.475, -41.4);
      bFloor.receiveShadow = true;
      this.scene.add(bFloor);

      const bCeiling = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.15, 10.2), this.corridorCeilingMat);
      bCeiling.position.set(3.9, -0.525, -41.4);
      this.scene.add(bCeiling);

      // Dinding Basement (Utara z = -46.4, Barat x = -2.1, Timur x = +9.9, & Selatan z = -36.4 di kiri-kanan tangga)
      const bNorthWall = new THREE.Mesh(new THREE.BoxGeometry(12.2, 4.0, 0.22), this.corridorWallMat);
      bNorthWall.position.set(3.9, -2.5, -46.4);
      bNorthWall.receiveShadow = true;
      this.scene.add(bNorthWall);

      const bWestWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.0, 10.2), this.corridorWallMat);
      bWestWall.position.set(-2.1, -2.5, -41.4);
      bWestWall.receiveShadow = true;
      this.scene.add(bWestWall);

      const bEastWall = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.0, 10.2), this.corridorWallMat);
      bEastWall.position.set(9.9, -2.5, -41.4);
      bEastWall.receiveShadow = true;
      this.scene.add(bEastWall);

      const bSouthWallLeft = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 0.22), this.corridorWallMat);
      bSouthWallLeft.position.set(0.4, -2.5, -36.4);
      this.scene.add(bSouthWallLeft);

      const bSouthWallRight = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 0.22), this.corridorWallMat);
      bSouthWallRight.position.set(7.4, -2.5, -36.4);
      this.scene.add(bSouthWallRight);

      // 4 Pilar Beton Tebal di Ruang Generator Basement
      const bPillarGeo = new THREE.BoxGeometry(0.68, 3.9, 0.68);
      [
        [1.1, -2.45, -39.5],
        [6.7, -2.45, -39.5],
        [1.1, -2.45, -43.0],
        [6.7, -2.45, -43.0]
      ].forEach(([px, py, pz]) => {
        const p = new THREE.Mesh(bPillarGeo, this.corridorWallMat);
        p.position.set(px, py, pz);
        p.castShadow = true;
        p.receiveShadow = true;
        this.scene.add(p);
      });

      // Deretan Pipa Uap Besi di Plafon Basement
      for (let pz = -38.0; pz >= -45.0; pz -= 2.3) {
        const steamPipe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 11.8, 12),
          this.ductMetalMat
        );
        steamPipe.rotation.z = Math.PI / 2;
        steamPipe.position.set(3.9, -0.85, pz);
        this.scene.add(steamPipe);
      }

      // ====================================================================
      // D. UNIT GENERATOR DIESEL DARURAT BESAR & TUAS MANUAL (x = 3.9, y = -4.4, z = -44.2)
      // ====================================================================
      this.generatorGroup = new THREE.Group();
      this.generatorGroup.position.set(3.9, -4.4, -44.2);

      const genBodyMat = new THREE.MeshStandardMaterial({
        color: 0x3b2c20,
        roughness: 0.62,
        metalness: 0.72
      });

      // Blok Mesin Utama Generator Diesel
      const genMainBlock = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.55, 1.45), genBodyMat);
      genMainBlock.position.set(0, 0.775, 0);
      genMainBlock.castShadow = true;
      genMainBlock.receiveShadow = true;
      this.generatorGroup.add(genMainBlock);

      // Turbin Silinder Dinamo
      const genTurbine = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.1, 16), steelMat);
      genTurbine.rotation.z = Math.PI / 2;
      genTurbine.position.set(0, 1.15, 0.15);
      this.generatorGroup.add(genTurbine);

      // Panel Sakelar Samping Generator tempat Tuas Manual dipasang
      const switchBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.68, 0.35), steelMat);
      switchBox.position.set(-1.15, 1.25, 0.65);
      switchBox.userData = { interactableType: 'generator_lever' };
      this.generatorGroup.add(switchBox);

      // Tuas Manual Besar (generatorLeverPivot & generatorLeverMesh) Berbahan Logam Berkarat
      const rustyLeverMat = new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        emissive: 0x2a0e05,
        emissiveIntensity: 0.4,
        roughness: 0.55,
        metalness: 0.78
      });

      this.generatorLeverPivot = new THREE.Group();
      this.generatorLeverPivot.position.set(-1.15, 1.28, 0.84);
      // Posisi awal tuas mengarah ke atas (-0.35 rad)
      this.generatorLeverPivot.rotation.x = -0.35;
      this.generatorGroup.add(this.generatorLeverPivot);

      const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.42, 10), rustyLeverMat);
      leverArm.position.set(0, 0.18, 0.08);
      leverArm.rotation.x = 0.4;
      leverArm.userData = { interactableType: 'generator_lever' };
      this.generatorLeverPivot.add(leverArm);

      const leverGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.18, 12), rustyLeverMat);
      leverGrip.rotation.z = Math.PI / 2;
      leverGrip.position.set(0, 0.34, 0.16);
      leverGrip.userData = { interactableType: 'generator_lever' };
      this.generatorLeverPivot.add(leverGrip);

      // Hitbox Tuas Generator agar mudah dijangkau Raycaster
      const leverHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.95, 0.85),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      leverHitbox.position.set(-1.15, 1.28, 0.75);
      leverHitbox.userData = { interactableType: 'generator_lever' };
      this.generatorGroup.add(leverHitbox);

      this.scene.add(this.generatorGroup);
      this.interactables.push(switchBox, leverArm, leverGrip, leverHitbox);

      // Lampu indikator kecil di atas tuas generator (merah saat mati, kuning/hijau saat menyala)
      this.genStatusLight = new THREE.PointLight(0xaa1111, 0.85, 5.5, 2);
      this.genStatusLight.position.set(2.75, -2.8, -43.1);
      this.scene.add(this.genStatusLight);

      // Lampu-lampu Kuning Industri Basement (awalnya sangat redup 0.12, menyala ke 1.5 saat generator aktif!)
      [
        [3.9, -0.95, -38.5],
        [3.9, -0.95, -42.5]
      ].forEach(([lx, ly, lz]) => {
        const bIndLight = new THREE.PointLight(0xffcc77, 0.15, 14.0, 2);
        bIndLight.position.set(lx, ly, lz);
        this.scene.add(bIndLight);
        this.industrialRecoveryLights.push({ light: bIndLight, targetIntensity: 1.5 });
      });

      // Entitas Bayangan Bermata Merah untuk Jumpscare Lari Cepat (Dash / Flicker Encounter) di Basement
      this.basementDashEntity = createShadowRedEyesEntity(THREE);
      this.basementDashEntity.position.set(-0.8, -4.4, -41.3);
      this.basementDashEntity.visible = false;
      this.scene.add(this.basementDashEntity);
    }

    /**
     * Menghitung elevasi ketinggian lantai (floorY) berdasarkan koordinat (x, z)
     * agar pemain dapat menuruni dan menaiki tangga Basement secara mulus!
     */
    getFloorElevationAt(x, z) {
      if (this.isInHospitalBed || this.isInEpilogueWalk) {
        return 20.0;
      }
      if (this.isOnFloorTwo) {
        // Bordes Tangga Darurat Lantai 2 & Koridor Lantai 2 (z <= -9.7) -> y = 0.0m
        if (z <= -9.7) {
          return 0.0;
        }
        // Tangga Darurat Menurun Lantai 2 -> Lantai 1 (z dari -9.7 s/d -1.3) -> turun linear dari 0.0m ke -4.2m
        if (z > -9.7 && z < -1.3) {
          const t = (z - (-9.7)) / 8.4;
          return -t * 4.2;
        }
        // Bordes Bawah Tangga & Koridor Staf Lantai 1 (z >= -1.3) -> datar di y = -4.2m
        return -4.2;
      }
      if (z >= -22.6) {
        return 0.0;
      }
      // Flight 1: z dari -22.6 s/d -28.6 -> turun linear dari 0.0m ke -2.2m
      if (z < -22.6 && z >= -28.6) {
        const t = (-22.6 - z) / 6.0;
        return -t * 2.2;
      }
      // Bordes Sempit Tengah: z dari -28.6 s/d -30.4 -> datar di -2.2m
      if (z < -28.6 && z >= -30.4) {
        return -2.2;
      }
      // Flight 2: z dari -30.4 s/d -36.4 -> turun linear dari -2.2m ke -4.4m
      if (z < -30.4 && z >= -36.4) {
        const t = (-30.4 - z) / 6.0;
        return -2.2 - t * 2.2;
      }
      // Lantai Ruang Generator Basement (z < -36.4) -> datar di -4.4m
      return -4.4;
    }

    /**
     * Merender tampilan layar hijau fosfor CRT CCTV (Scanline/Noise + Penampakan Mata Merah di detik 1.5)
     */
    _updateCctvMonitorCanvas(elapsed) {
      if (!this.cctvCtx || !this.cctvTex) return;
      const ctx = this.cctvCtx;
      const w = 256;
      const h = 192;

      // Latar hijau fosfor gelap ruang generator basement
      ctx.fillStyle = '#041408';
      ctx.fillRect(0, 0, w, h);

      // Gambar siluet pilar & generator basement pada kamera CCTV
      ctx.fillStyle = '#0a2912';
      ctx.fillRect(28, 20, 26, 150);
      ctx.fillRect(198, 20, 26, 150);
      ctx.fillStyle = '#0e3618';
      ctx.fillRect(88, 78, 80, 68);

      // Jika sedang dalam sekuens inspeksi CCTV pada detik ke-1.5 s/d 1.9 (durasi 0.4 detik):
      // Sepasang mata merah menyala melesat kencang dari kanan ke kiri dengan glitch!
      if (this.isCctvInspecting && this.cctvInspectTimer >= 1.5 && this.cctvInspectTimer <= 1.92) {
        const dashProg = (this.cctvInspectTimer - 1.5) / 0.4;
        const ex = 220 - dashProg * 195;
        const ey = 96 + Math.sin(dashProg * 25) * 6;

        // Glitch horizontal bars
        ctx.fillStyle = 'rgba(180, 255, 200, 0.35)';
        ctx.fillRect(0, (Math.random() * h) | 0, w, 14);

        // Siluet hitam pekat berlari
        ctx.fillStyle = '#010302';
        ctx.beginPath();
        ctx.ellipse(ex, ey + 25, 22, 48, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Sepasang mata merah menyala tajam
        ctx.fillStyle = '#ff1111';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(ex - 7, ey - 8, 4.5, 0, Math.PI * 2);
        ctx.arc(ex + 7, ey - 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Garis-garis Scanline CRT & bintik noise fosfor
      ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }
      for (let i = 0; i < 45; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(90, 255, 130, 0.18)' : 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 12 + Math.random() * 25, 2);
      }

      // Label OSD Kamera CCTV
      ctx.fillStyle = '#55ff88';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('CAM_04 // BASEMENT GEN', 14, 24);
      ctx.fillText(this.isGeneratorRunning ? 'PWR: ONLINE' : 'PWR: MANUAL_OFF', 14, 178);

      this.cctvTex.needsUpdate = true;
    }

    /**
     * 1. Sekuens Masuk Ruang Panel 3B (maya_enter_maintenance.mp3 — 8000ms)
     */
    _triggerEnterMaintenance3B() {
      if (this.hasEnteredMaintenance3B) return;
      this.hasEnteredMaintenance3B = true;
      this.isActionBusy = true;

      this.game.setObjective('Periksa monitor CCTV dan cari jalan menuju generator darurat.');
      this._playExactTimedMonologue(
        'assets/audio/maya_enter_maintenance.mp3',
        8000,
        'MAYA',
        'Monitor keamanan... tunggu, daya ke lantai bawah ada di mode manual. Generator cadangannya ada di bawah sana.'
      );
    }

    /**
     * 2. Sistem Interaksi Monitor CCTV (Foreshadowing Scare)
     */
    _inspectCctvMonitor() {
      if (this.isCctvInspecting) return;
      this.isCctvInspecting = true;
      this.hasInspectedCctv = true;
      this.cctvInspectTimer = 0;
      this.game._setInteractionPrompt('');

      // Putar audio statis CCTV: assets/audio/sfx_cctv_static.mp3 (Pemain tetap bebas bergerak & melihat!)
      this.game.playOneShotSfx('assets/audio/sfx_cctv_static.mp3');

      // Setelah 2.2 detik (setelah mata merah melesat di layar monitor), putar reaksi Maya tanpa membekukan kamera
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isCctvInspecting = false;

        // Putar monolog reaksi Maya: maya_cctv_reaction.mp3 (Durasi presisi: 6000ms)
        this.game.setObjective('Turun ke basement dan nyalakan generator darurat.');
        this._playExactTimedMonologue(
          'assets/audio/maya_cctv_reaction.mp3',
          6000,
          'MAYA',
          '[terkesiap] Kamu lihat itu barusan?! Ada sesuatu yang baru saja lari melintasi kamera empat... dia ada di bawah sana.'
        );
      }, 2200);
    }

    /**
     * 5. Menyalakan Generator Darurat (Tuas berotasi 45 derajat + Pemulihan Daya Listrik Gedung)
     */
    _pullGeneratorLever() {
      if (this.isGeneratorRunning || this.isLeverAnimating) return;
      this.isLeverAnimating = true;
      this.leverAnimStart = performance.now();
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // 1. Putar audio tarikan tuas logam berat: assets/audio/sfx_lever_pull.mp3
      this.game.playOneShotSfx('assets/audio/sfx_lever_pull.mp3');

      // 2. Setelah tuas ditarik turun (~500ms), putar mesin mulai meraung: sfx_generator_start.mp3
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isGeneratorRunning = true;
        this.isElevatorPowered = true;
        this.game.isElevatorPowered = true;

        this.game.playOneShotSfx('assets/audio/sfx_generator_start.mp3');

        if (this.genStatusLight) {
          this.genStatusLight.color.setHex(0x44ff66);
          this.genStatusLight.intensity = 1.6;
        }

        // Lampu-lampu neon di basement dan lantai 3 berkedip hidup satu per satu (kuning industri redup intensitas 1.5)
        this.industrialRecoveryLights.forEach((item, idx) => {
          this.game.setPauseAwareTimeout(() => {
            if (item.light) {
              item.light.color.setHex(0xffcc77);
              item.light.intensity = item.targetIntensity || 1.5;
            }
          }, 450 + idx * 550);
        });

        // Pulihkan lampu neon lobi utama lantai 3 dengan warna kuning industri (intensitas 1.5)
        this.game.setPauseAwareTimeout(() => {
          if (this.lobbyNeonLight) {
            this.lobbyNeonLight.color.setHex(0xffcc77);
            this.lobbyNeonLight.intensity = 1.5;
          }
          if (this.lobbyNeonMat) {
            this.lobbyNeonMat.emissive.setHex(0xffcc77);
            this.lobbyNeonMat.emissiveIntensity = 0.55;
          }
          if (this.elevatorErrorLight) {
            this.elevatorErrorLight.color.setHex(0x33ff77);
            this.elevatorErrorLight.intensity = 1.2;
          }
          if (this.elevatorButtonMat) {
            this.elevatorButtonMat.color.setHex(0x33ff77);
          }
        }, 1200);

        // 3. Jalankan monolog Maya: maya_generator_on.mp3 (Durasi presisi: 8000ms)
        this.game.setObjective('Kembali ke lantai tiga dan masuki lift utama di lobi sebelum terlambat.');
        this._playExactTimedMonologue(
          'assets/audio/maya_generator_on.mp3',
          8000,
          'MAYA',
          'Berhasil! Saklar utamanya mendengung. Lift di lobi pasti sudah nyala sekarang... aku harus segera kembali ke atas!'
        );
      }, 550);
    }

    _buildEmergencyWallLights() {
      const THREE = window.THREE;
      const lampHousingMat = new THREE.MeshStandardMaterial({
        color: 0x221010,
        roughness: 0.5,
        metalness: 0.6
      });

      const emergencySpots = [
        { lx: -1.18, ly: 2.38, lz: -5.8, fx: -1.30, fz: -5.8, isLobby: false },
        { lx: -1.18, ly: 2.38, lz: -13.6, fx: -1.30, fz: -13.6, isLobby: false },
        { lx: 3.35, ly: 2.45, lz: -10.0, fx: 3.35, fz: -9.72, isLobby: true },
        { lx: 9.45, ly: 2.45, lz: -10.0, fx: 9.45, fz: -9.72, isLobby: true },
        { lx: 20.8, ly: 2.42, lz: -10.2, fx: 21.0, fz: -9.8, isLobby: false }
      ];

      emergencySpots.forEach((spot) => {
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0xff2222,
          emissive: 0xaa1111,
          emissiveIntensity: 0.95,
          roughness: 0.2
        });
        const ptLight = new THREE.PointLight(0x881111, 1.05, 11.0, 2);
        ptLight.position.set(spot.lx, spot.ly, spot.lz);
        this.scene.add(ptLight);

        const housing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.22), lampHousingMat);
        housing.position.set(spot.fx, spot.ly, spot.fz);
        this.scene.add(housing);

        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), lensMat);
        lens.position.set(spot.fx, spot.ly - 0.01, spot.fz);
        this.scene.add(lens);

        if (spot.isLobby) {
          this.lobbyEmergencyLights.push({ light: ptLight, lensMat });
        }
      });
    }

    isPositionWalkable(x, z, r) {
      if (!this.game.isDoorOpen) return false;

      if (this.isOnFloorTwo) {
        return this._isFloorTwoPositionWalkable(x, z, r);
      }

      // 1. Hub Utama / Lobby Sentral (10m x 8m)
      const inLobby = (
        x >= 1.4 + r &&
        x <= 11.4 - r &&
        z >= -17.6 + r &&
        z <= -9.6 - r
      );

      // 2. Jalur Sayap Barat -> Lobby -> Sayap Timur
      const inWingConnector = (
        x >= 0.8 &&
        x <= 22.4 - r &&
        z >= -15.0 + r &&
        z <= -12.2 - r
      );

      // 3. Ambang Pintu & Interior Kamar 304 (5m x 4m)
      const inRoom304Doorway = !this.isRoom304TrapLocked && (
        x >= 14.3 + r * 0.5 &&
        x <= 15.3 - r * 0.5 &&
        z >= -15.55 &&
        z <= -14.45
      );

      const inRoom304Interior = (
        x >= 12.3 + r &&
        x <= 17.3 - r &&
        z >= -19.0 + r &&
        z <= -15.0 - r * 0.55
      );

      if (inRoom304Interior) {
        if (x - r < 13.9 && z + r > -18.2 && z - r < -16.0) return false;
        if (x + r > 15.1 && x - r < 16.6 && z - r < -17.85) return false;
        return true;
      }

      // 3B. Interior Kabin Lift Utama (x: 7.05..8.75, z: -10.2..-7.7) saat pintu lift terbuka
      const inElevatorCabin = (this.isElevatorCabinOpen || this.isInsideElevatorCabin) && (
        x >= 7.05 + r * 0.4 &&
        x <= 8.75 - r * 0.4 &&
        z >= (this.isElevatorDescending && !this.isOnFloorTwo ? -9.55 : -10.4) &&
        z <= -7.7 + r * 0.3
      );
      if (inElevatorCabin) return true;

      // 4. Ambang Pintu & Interior Ruang Panel 3B (6m x 5m: x dari -0.1 s/d +5.9, z dari -17.6 s/d -22.6)
      const inMaintenance3BDoorway = this.isMaintenance3BOpen && (
        x >= 2.32 + r * 0.3 &&
        x <= 3.48 - r * 0.3 &&
        z >= -18.3 &&
        z <= -16.9
      );
      const inMaintenance3BInterior = this.isMaintenance3BOpen && (
        x >= -0.1 + r &&
        x <= 5.9 - r &&
        z >= -22.75 &&
        z <= -17.6 - r * 0.25
      );
      // 5. Pintu & Tangga Menuju Basement (x: 3.02..4.78, z: -37.2..-21.8 — menyambung mulus tanpa dinding tak kasat mata!)
      const inBasementStairwell = this.isMaintenance3BOpen && (
        x >= 3.02 + r * 0.35 &&
        x <= 4.78 - r * 0.35 &&
        z >= -37.2 &&
        z <= -21.8
      );
      if (inBasementStairwell) return true;

      if (inMaintenance3BInterior) {
        // Collider meja CCTV (x: 0.15..2.35, z: -21.7..-20.7)
        if (x + r > 0.15 && x - r < 2.35 && z + r > -21.7 && z - r < -20.7) {
          return false;
        }
        return true;
      }

      // 6. Ruang Generator Basement (12m x 10m: x dari -2.1 s/d +9.9, z dari -46.4 s/d -36.0)
      const inBasementMachineRoom = this.isMaintenance3BOpen && (
        x >= -2.1 + r &&
        x <= 9.9 - r &&
        z >= -46.4 + r &&
        z <= -36.0
      );
      if (inBasementMachineRoom) {
        // Collider Unit Generator Diesel (x: 2.3..5.2, z: -45.1..-43.3)
        if (x + r > 2.4 && x - r < 5.2 && z + r > -45.1 && z - r < -43.3) {
          return false;
        }
        // Collider 4 Pilar Beton Basement
        const pillars = [
          [1.1, -39.5],
          [6.7, -39.5],
          [1.1, -43.0],
          [6.7, -43.0]
        ];
        for (let i = 0; i < pillars.length; i++) {
          const [px, pz] = pillars[i];
          if (Math.abs(x - px) < 0.34 + r && Math.abs(z - pz) < 0.34 + r) {
            return false;
          }
        }
        return true;
      }

      // 5. Bordes Tangga Darurat
      const inStairwellApproach = (
        x >= 19.6 + r &&
        x <= 22.4 - r &&
        z >= -13.0 &&
        z <= -9.55
      );

      return (
        inLobby ||
        inWingConnector ||
        inRoom304Doorway ||
        inMaintenance3BDoorway ||
        inMaintenance3BInterior ||
        inStairwellApproach
      );
    }

    /**
     * Evaluasi Collider Lantai 2 (The Flooded Ward):
     * - Kabin Lift (x: 7.05..8.75, z: -9.6..-7.7)
     * - Celah Merayap Pintu Lift (x: 7.25..8.55, z: -10.1..-9.4) -> WAJIB JONGKOK (isCrouching === true)!
     * - Koridor Selatan (x: 4.0..20.0, z: -12.5..-9.7)
     * - Bordes Tangga Darurat Lantai 2 (x: 0.8..4.1, z: -12.5..-9.7) -> hanya jika isFloor2StairDoorOpen === true
     * - Koridor Barat (x: 4.0..6.8, z: -24.5..-12.5)
     * - Kamar 201 (x: 0.0..4.15, z: -18.4..-14.0) via pintu terbuka separuh di z: -16.75..-15.65
     * - Lubang Tembok Jebol 201 -> 203 (x: 1.25..2.75, z: -18.8..-18.0)
     * - Kamar 203 (x: 0.0..4.0, z: -22.8..-18.4)
     * - Koridor Timur (x: 17.2..20.0, z: -24.5..-12.5)
     * - Koridor Utara (x: 4.0..20.0, z: -24.5..-21.7)
     * - Kamar 205 Gudang Servis (x: 16.4..21.2, z: -28.6..-24.3) via pintu x: 18.0..19.2
     */
    _isFloorTwoPositionWalkable(x, z, r) {
      // Walkability untuk Kamar Rawat, Lorong Sayap Medis, & Ruang Arsip Perbatasan (Epilogue Module)
      if (this.isInEpilogueWalk) {
        const inHospRoom = (x >= -2.6 + r && x <= 2.6 - r && z >= -3.4 && z <= 2.0 - r);
        const inMedCorridor = (x >= -2.0 + r && x <= 2.0 - r && z >= -14.8 && z <= -3.0);
        const inBorderArchive = (x >= -4.6 + r && x <= 4.6 - r && z >= -23.1 + r && z <= -14.3);
        return Boolean(inHospRoom || inMedCorridor || inBorderArchive);
      }
      // 1. Interior Kabin Lift
      const inCabin = (
        x >= 7.05 + r * 0.35 &&
        x <= 8.75 - r * 0.35 &&
        z >= -9.55 &&
        z <= -7.7 + r * 0.3
      );
      if (inCabin) return true;

      // 2. Celah Bawah Pintu Lift (50 cm) -> Pemain wajib menekan tombol jongkok ([Shift] / [C]) untuk merayap keluar!
      const inElevatorCrawlGap = (
        x >= 7.22 + r * 0.3 &&
        x <= 8.58 - r * 0.3 &&
        z >= -10.05 &&
        z <= -9.45
      );
      if (inElevatorCrawlGap) {
        if (!this.game.isCrouching && !this.hasCrawledOutOfElevator) {
          this.game._setInteractionPrompt('Celah pintu lift hanya 50 cm! Tekan [SHIFT] atau [C] untuk merayap keluar.');
          return false;
        }
        return true;
      }

      // 3. Bordes Tangga Darurat Lantai 2, Tangga Turun ke Lantai 1, & Koridor Staf Lantai 1
      // Pastikan bounding box tangga hanya menopang pijakan dan tidak menutup jalan keluar menuju pintu darurat Lantai 1!
      const inStairwellToFloor1 = (this.isFloor2StairDoorOpen || this.isFloor2StairDoorSlammedSafe) && (
        x >= 0.85 + r * 0.25 &&
        x <= 2.95 - r * 0.25 &&
        z >= -12.4 &&
        z <= (this.isFloor1EntryDoorOpen ? 2.2 : 1.42)
      );
      if (inStairwellToFloor1) return true;

      const inFloor1EntryDoorway = this.isFloor1EntryDoorOpen && (
        x >= 1.05 &&
        x <= 2.75 &&
        z >= 0.8 &&
        z <= 2.4
      );
      if (inFloor1EntryDoorway) return true;

      const inFloor1StaffCorridor = this.isFloor1EntryDoorOpen && (
        x >= 0.48 + r * 0.5 &&
        x <= 3.32 - r * 0.5 &&
        z >= 1.2 &&
        z <= (this.isFloor1DoubleDoorUnlocked && !this.isPlayerTrappedInArchive ? 18.2 : 17.38)
      );
      if (inFloor1StaffCorridor) {
        // Collider Loker Inventaris & Meja Pos Keamanan di sisi barat koridor (x < 1.32, z: 5.0..8.65)
        if (x - r < 1.32 && z + r > 5.0 && z - r < 8.65) {
          return false;
        }
        return true;
      }

      // Ambang Pintu Masuk Ruang Arsip (z = 17.0..18.0): Terkunci rapat kembali begitu jebakan Panic Archive aktif!
      const inFloor1DoubleDoorway = (
        this.isFloor1DoubleDoorUnlocked &&
        (!this.isPlayerTrappedInArchive || this.isArchiveExitBreached) &&
        x >= 1.05 + r * 0.3 &&
        x <= 2.75 - r * 0.3 &&
        z >= 17.0 &&
        z <= 18.1
      );
      if (inFloor1DoubleDoorway) return true;

      // Interior Ruang Arsip Darurat (Panic Archive Room: x = -1.0..+4.8, z = 17.75..24.25)
      // Pemain tetap bebas bergerak terbatas di dalam Ruang Arsip selama dialog berlangsung!
      const inPanicArchiveRoom = this.isFloor1DoubleDoorUnlocked && (
        x >= -0.95 + r * 0.5 &&
        x <= 4.75 - r * 0.5 &&
        z >= (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached ? 17.82 : 17.5) &&
        z <= (this.isArchiveExitBreached ? 24.8 : 24.22)
      );
      if (inPanicArchiveRoom) {
        // Collider Meja Kerja di Ruang Arsip (x: 2.55..4.15, z: 21.85..22.95)
        if (x + r > 2.55 && x - r < 4.15 && z + r > 21.85 && z - r < 22.95) {
          return false;
        }
        return true;
      }

      // Ambang Pintu Keluar Ruang Arsip & Koridor Lobi (z = 24.0 s/d 28.45 karena tertutup Reruntuhan Pilar Utama!)
      const maxLobbyZ = this.isLobbyPillarCollapsed ? 28.45 : 35.9;
      const inMainLobbyCorridor = this.isArchiveExitBreached && !this.isSecurityHubDoorLocked && (
        x >= -2.05 + r * 0.5 &&
        x <= 5.8 - r &&
        z >= 24.0 &&
        z <= maxLobbyZ
      );
      if (inMainLobbyCorridor) return true;

      // Ambang Pintu Masuk/Keluar Ruang Kontrol Keamanan (Security Hub Doorway: x = -2.85..+0.8, z = 26.12..27.52)
      const isHubDoorPassable = !this.isSecurityHubDoorLocked || this.isSecurityHubExitDoorOpen;
      const inSecurityHubDoorway = this.isArchiveExitBreached && isHubDoorPassable && (
        x >= -2.85 &&
        x <= 0.8 &&
        z >= 26.12 + r * 0.25 &&
        z <= 27.52 - r * 0.25
      );
      if (inSecurityHubDoorway) return true;

      // Interior Ruang Kontrol Keamanan (Security Hub: x = -5.68 s/d -2.42, z = 25.0 s/d 30.6)
      const inSecurityHubRoom = this.isArchiveExitBreached && (
        x >= -5.68 + r * 0.35 &&
        x <= (isHubDoorPassable ? -1.8 : -2.42 - r * 0.25) &&
        z >= 25.0 + r * 0.4 &&
        z <= (this.isSecurityHubExitDoorOpen ? 31.5 : 30.6 - r * 0.4)
      );
      if (inSecurityHubRoom) return true;

      // Jalur Penghubung Keluar Security Hub menuju Koridor Sayap Barat & Kargo (Cargo Hall)
      const inCargoConnector = (this.isSecurityHubExitDoorOpen || this.canUnlockSecurityHubDoorToExit) && isHubDoorPassable && (
        x >= -4.4 + r * 0.3 &&
        x <= 1.8 - r * 0.3 &&
        z >= 26.2 &&
        z <= 32.0
      );
      if (inCargoConnector) return true;

      // 12A. Koridor Sayap Barat & Kargo (Cargo Hall: x = -10.3..+1.9, z = 30.8..44.2)
      const inCargoHall = (this.isSecurityHubExitDoorOpen || this.canUnlockSecurityHubDoorToExit) && (
        x >= -10.3 + r * 0.4 &&
        x <= 1.9 - r * 0.4 &&
        z >= 30.8 &&
        z <= 44.2
      );
      if (inCargoHall) {
        if (x + r > -8.0 && x - r < -5.6 && z + r > 32.5 && z - r < 37.1) return false;
        if (x + r > -2.4 && x - r < 0.0 && z + r > 37.6 && z - r < 42.0) return false;
        if (x + r > -4.95 && x - r < -3.45 && z + r > 40.45 && z - r < 42.55) return false;
        return true;
      }

      // 12B. Ruang Medis Darurat (Medical Bay: x = -16.3..-10.0, z = 33.2..40.3)
      const inMedicalBay = (this.isSecurityHubExitDoorOpen || this.canUnlockSecurityHubDoorToExit) && (
        x >= -16.3 + r * 0.4 &&
        x <= -10.0 &&
        z >= 33.2 + r * 0.4 &&
        z <= 40.3 - r * 0.4
      );
      if (inMedicalBay) return true;

      // 12C. Ruang Genset (Generator Room: x = -9.3..+1.9, z = 44.0..54.6)
      const inGeneratorRoom = (this.isSecurityHubExitDoorOpen || this.canUnlockSecurityHubDoorToExit) && (
        x >= -9.3 + r * 0.4 &&
        x <= 1.9 - r * 0.4 &&
        z >= 44.0 &&
        z <= 54.6
      );
      if (inGeneratorRoom) {
        if (x + r > -7.95 && x - r < -5.05 && z + r > 45.9 && z - r < 52.5) return false;
        return true;
      }

      // 12D. Atrium Konsol Gerbang Utama & Jalur Ekstraksi Kendaraan Taktis APC (z = 54.4..69.5)
      const maxGateZ = (this.isBlastDoorOpen || this.isBlastDoorOpening) ? 69.5 : 63.4;
      const inMainGateHall = (this.isSecurityHubExitDoorOpen || this.canUnlockSecurityHubDoorToExit) && (
        x >= -8.3 + r * 0.4 &&
        x <= 1.9 - r * 0.4 &&
        z >= 54.4 &&
        z <= maxGateZ
      );
      if (inMainGateHall) return true;

      if (this.isFloor2StairDoorSlammedSafe) {
        return (
          x >= 0.8 + r &&
          x <= 3.9 - r * 0.5 &&
          z >= -12.5 + r &&
          z <= -9.6
        );
      }
      const inFloor2StairLanding = this.isFloor2StairDoorOpen && (
        x >= 0.8 + r &&
        x <= 4.2 &&
        z >= -12.4 + r * 0.5 &&
        z <= -9.8 - r * 0.5
      );
      if (inFloor2StairLanding) return true;

      // 4. Koridor Persegi Melingkar Lantai 2 (South, West, East, North)
      const inSouthCorridor = (
        x >= 4.0 + r * 0.6 &&
        x <= 20.0 - r * 0.6 &&
        z >= -12.5 + r * 0.5 &&
        z <= -9.7 - r * 0.5
      );
      const inWestCorridor = (
        x >= 4.0 + r * 0.5 &&
        x <= 6.8 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -12.2
      );
      const inEastCorridor = (
        x >= 17.2 + r * 0.5 &&
        x <= 20.0 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -12.2
      );
      const inNorthCorridor = (
        x >= 4.0 + r * 0.5 &&
        x <= 20.0 - r * 0.5 &&
        z >= -24.5 + r * 0.5 &&
        z <= -21.7 - r * 0.5
      );

      // 5. Ambang Pintu & Interior Kamar 201 (x: 0.0..4.0, z: -18.4..-14.0)
      const inRoom201Doorway = (
        x >= 3.6 &&
        x <= 4.35 &&
        z >= -16.75 &&
        z <= -15.65
      );
      const inRoom201 = (
        x >= 0.0 + r &&
        x <= 4.0 - r * 0.4 &&
        z >= -18.4 + r * 0.4 &&
        z <= -14.0 - r
      );

      // 6. Lubang Tembok Jebol antara Kamar 201 dan Kamar 203 (x: 1.25..2.75, z: -18.85..-17.95)
      const inBreachedWallHole = (
        x >= 1.28 + r * 0.3 &&
        x <= 2.72 - r * 0.3 &&
        z >= -18.85 &&
        z <= -17.95
      );

      // 7. Interior Kamar 203 (x: 0.0..4.0, z: -22.8..-18.4)
      const inRoom203 = (
        x >= 0.0 + r &&
        x <= 4.0 - r * 0.5 &&
        z >= -22.8 + r &&
        z <= -18.4 - r * 0.4
      );

      // 8. Kamar 205 — Gudang Servis (x: 16.4..21.2, z: -28.6..-24.5, pintu di x: 17.9..19.3)
      const inRoom205Doorway = (
        x >= 17.95 &&
        x <= 19.25 &&
        z >= -24.85 &&
        z <= -24.15
      );
      const inRoom205 = (
        x >= 16.4 + r &&
        x <= 21.2 - r &&
        z >= -28.6 + r &&
        z <= -24.5 - r * 0.4
      );

      return (
        inSouthCorridor ||
        inWestCorridor ||
        inEastCorridor ||
        inNorthCorridor ||
        inRoom201Doorway ||
        inRoom201 ||
        inBreachedWallHole ||
        inRoom203 ||
        inRoom205Doorway ||
        inRoom205
      );
    }

    /**
     * Fallback deteksi jarak dekat (proximity) untuk objek penting di Tangga Bawah & Lantai 1
     * agar pemain tetap dapat menekan [E] meskipun kursor tidak tepat di tengah hitbox kecil.
     */
    getProximityInteractable(camPos) {
      if (!camPos || !this.isOnFloorTwo) return null;

      // 1. Pintu Keluar Darurat "Lantai 1 - Area Staf" di ujung bawah tangga darurat (z = +1.5)
      if (
        !this.isFloor1EntryDoorOpen &&
        !this.isFloor1EntryDoorAnimating &&
        camPos.x >= 0.75 &&
        camPos.x <= 3.05 &&
        camPos.z >= -0.8 &&
        camPos.z <= 1.55
      ) {
        return {
          type: 'floor1_stair_exit_door',
          prompt: '[E] Buka Pintu Darurat (Lantai 1 - Area Staf)'
        };
      }

      // 2. Unit Radio HT di atas meja keamanan Lantai 1 (radius <= 2.5 meter dari (1.08, -3.41, 7.8))
      if (this.radioHTMesh && !this.hasPickedUpRadioHT && camPos.y < -2.0) {
        const distToRadio = Math.hypot(camPos.x - 1.08, camPos.z - 7.8);
        if (distToRadio <= 2.5) {
          return {
            type: 'radio_ht',
            prompt: '[E] Ambil Radio HT'
          };
        }
      }

      // 3. Pintu Double-Door di ujung koridor staf Lantai 1 (z = +17.5)
      if (
        this.isFloor1EntryDoorOpen &&
        !this.isFloor1DoubleDoorUnlocked &&
        camPos.x >= 0.6 &&
        camPos.x <= 3.2 &&
        camPos.z >= 15.3 &&
        camPos.z <= 17.55
      ) {
        return {
          type: 'floor1_double_door',
          prompt: '[Terkunci] Pintu Ganda Ruang Kontrol Keamanan (Selesaikan Transmisi Radio)'
        };
      }

      // 4. Pintu Baja & Gerendel Manual Ruang Kontrol Keamanan (Security Hub) di x = -2.2, z = 26.85
      if (this.securityHubDoor && this.isArchiveExitBreached) {
        const dHubDoor = Math.hypot(camPos.x - (-2.2), camPos.z - 26.85);
        if (dHubDoor <= 2.75) {
          if (!this.isSecurityHubDoorLocked && !this.hasPlayerEnteredSecurityHub) {
            return {
              type: 'security_hub_door',
              prompt: '[E] Masuk & Kunci Gerendel Manual Ruang Kontrol Keamanan'
            };
          }
          if (this.canUnlockSecurityHubDoorToExit && !this.isSecurityHubExitDoorOpen) {
            return {
              type: 'security_hub_door',
              prompt: '[E] Buka Kunci Pintu Ruang Kontrol (Menuju Koridor Kargo)'
            };
          }
        }
      }

      // 5. Tuas Pemutus Daya Sektor 2 di Konsol Security Hub (x = -5.95, z = 28.58)
      if (this.sector2BreakerMesh && this.isSecurityHubDoorLocked && !this.hasPulledSector2Lever) {
        const dLever = Math.hypot(camPos.x - (-5.95), camPos.z - 28.58);
        if (dLever <= 2.85) {
          return {
            type: 'sector2_breaker_lever',
            prompt: this.isSector2LeverReady
              ? '[E] Tarik Tuas Pemutus Daya Sektor 2'
              : 'Konsol Pemutus Daya Sektor 2 (Menunggu Aba-aba Komando Dhafir)'
          };
        }
      }

      // 6. Konsol Gerbang Utama di Main Gate Hall (x = -3.2, z = 61.2)
      if (this.mainGateConsoleMesh && !this.isBlastDoorOpening && !this.isBlastDoorOpen) {
        const dGate = Math.hypot(camPos.x - (-3.2), camPos.z - 61.2);
        if (dGate <= 2.85) {
          return {
            type: 'main_gate_console',
            prompt: '[E] Dekripsi & Buka Gerbang Lapis Baja Utama'
          };
        }
      }

      // 7. Pintu Belakang Kendaraan Taktis APC di Luar Gerbang (x = -3.2, z = 65.5)
      if (this.isWaitingToBoardApc && !this.hasBoardedApc) {
        const dApc = Math.hypot(camPos.x - (-3.2), camPos.z - 65.5);
        if (dApc <= 3.2) {
          return {
            type: 'tactical_apc_entry',
            prompt: '[E] Naik ke Dalam Kendaraan Taktis Code 0'
          };
        }
      }

      return null;
    }

    getInteractionPrompt(type) {
      switch (type) {
        case 'lobby_window':
          if (this.isCurtainAnimating) return '';
          return this.areCurtainsOpen ? '[E] Lihat ke Luar' : '[E] Buka Gorden';
        case 'elevator':
          if (this.isOnFloorTwo) {
            return '[Lift Rusak] Pintu Terbuka Paksa di Lantai 2';
          }
          if (this.isElevatorCabinOpen) {
            return 'Melangkah Masuk ke Kabin Lift & Tekan Panel [E]';
          }
          return this.isElevatorPowered
            ? '[E] Buka Pintu Lift Utama (Daya Aktif)'
            : '[E] Tekan Tombol Lift';
        case 'elevator_cabin_panel':
          if (this.isOnFloorTwo) {
            return '[Panel Mati] Lift Macet di Lantai 2';
          }
          if (this.isElevatorDescending) return '';
          return this.isElevatorPowered
            ? '[E] Tekan Tombol Panel Lantai Dasar (Lantai 1)'
            : '[Panel Lift Mati]';
        case 'cctv_monitor':
          return '[E] Periksa Monitor CCTV';
        case 'basement_access_door':
          return '[E] Jalan Menuju Tangga Basement';
        case 'generator_lever':
          return this.isGeneratorRunning
            ? '[Generator Aktif] Daya Listrik Gedung Menyala'
            : '[E] Tarik Tuas Generator Darurat';
        case 'barricaded_stairs':
          return '[E] Periksa Barikade Tangga Darurat';
        case 'room_304_door':
          if (this.isRoom304TrapLocked) {
            return '[Terkunci Rapat] Pintu Kamar 304 Macet!';
          }
          if (this.room304TargetAngle < 1.3 && !this.isRoom304Animating) {
            return '[E] Dorong Pintu Kamar 304 Lebih Lebar';
          }
          return '';
        case 'stairwell_key':
          if (!this.hasMaintenanceKey) {
            return '[E] Ambil Kunci Ruang Panel 3B';
          }
          return '';
        case 'maintenance_3b_door':
          if (this.isMaintenance3BOpen || this.isMaintenance3BAnimating) return '';
          return this.hasMaintenanceKey
            ? '[E] Buka Pintu Maintenance 3B (Gunakan Kunci Panel 3B)'
            : '[Terkunci] Maintenance 3B - Authorized Personnel Only';
        case 'room_305_knock':
          return '[E] Ketuk Pintu';
        case 'room_307_knock':
          return '[E] Ketuk Pintu';
        case 'floor2_padlock':
          if (this.isFloor2StairDoorSlammedSafe) {
            return '[Terkunci Rapat] Entitas Terkunci di Luar Tangga Darurat';
          }
          if (this.isPadlockUnlocked) {
            return 'Melangkah Masuk ke Bordes Tangga Darurat!';
          }
          return (this.hasFullPadlockCode || (this.hasDigit7 && this.hasDigits42))
            ? '[E] Buka Gembok Kombinasi (Masukkan Kode: 7 - 4 - 2)'
            : '[E] Periksa Gembok Kombinasi 3 Angka';
        case 'room201_memo':
          return '[E] Baca Memo Penghuni Kamar 201 (Peringatan Pantulan Air)';
        case 'floor2_breaker':
          return this.isFloor2BreakerOn
            ? '[E] Matikan Saklar Sekring Listrik Lantai 2'
            : '[Sekring Mati] Aliran Listrik Genangan Air Telah Diputus';
        case 'wall_digit_7':
          return '[E] Periksa Angka Tercakar di Dinding: "7"';
        case 'room205_memo':
          return '[E] Periksa Papan Memo Inventaris Gudang 205 ("4 - 2")';
        case 'floor1_stair_exit_door':
          if (this.isFloor1EntryDoorOpen || this.isFloor1EntryDoorAnimating) return '';
          return '[E] Buka Pintu Darurat (Lantai 1 - Area Staf)';
        case 'radio_ht':
          if (this.hasPickedUpRadioHT) return '';
          return '[E] Ambil Radio HT';
        case 'floor1_double_door':
          if (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached) {
            return '[Terkunci Mati] Pintu Hidrolik Baja Mengunci Otomatis dari Luar!';
          }
          if (this.isFloor1DoubleDoorUnlocked) return 'Masuk ke Ruang Arsip / Staf Lantai 1';
          return '[Terkunci] Pintu Ganda Ruang Arsip Staf (Selesaikan Transmisi Radio)';
        case 'archive_hydraulic_door':
          if (this.isArchiveExitBreached) return 'Lari Menuju Atrium Lobi Utama!';
          return '[Terkunci Mati] Panel Elektronik Hangus — Engsel Hidrolik Terkunci';
        case 'main_lobby_glass_exit':
          if (this.isLobbyPillarCollapsed) return '[Tertutup Reruntuhan Pilar] Jalur Lobi Utama Tertimbun Beton!';
          return '[E] Buka Pintu Kaca Lobi Utama (Menuju Posko Evakuasi Dhafir)';
        case 'security_hub_door':
          if (this.isSecurityHubExitDoorOpen) return 'Menuju Koridor Kargo & Ruang Genset Lantai 1';
          if (this.canUnlockSecurityHubDoorToExit) return '[E] Buka Kunci Pintu Ruang Kontrol (Menuju Koridor Kargo)';
          if (this.isSecurityHubDoorLocked) return '[Terkunci Rapat] Gerendel Baja Manual Security Hub Aktif';
          return '[E] Masuk & Kunci Gerendel Manual Ruang Kontrol Keamanan';
        case 'main_gate_console':
          if (this.isBlastDoorOpen || this.isBlastDoorOpening) return 'Gerbang Terbuka — Lari Menuju Kendaraan Taktis!';
          return '[E] Dekripsi & Buka Gerbang Lapis Baja Utama';
        case 'tactical_apc_entry':
          if (this.hasBoardedApc) return '';
          return '[E] Naik ke Dalam Kendaraan Taktis Code 0';
        case 'sector2_breaker_lever':
          if (this.hasPulledSector2Lever) return '[Sektor 2 Padam] Pemutus Daya Sektor 2 Telah Ditarik';
          if (this.isSector2LeverReady) return '[E] Tarik Tuas Pemutus Daya Sektor 2';
          return 'Konsol Pemutus Daya Sektor 2 (Menunggu Aba-aba Komando Dhafir)';
        default:
          return '';
      }
    }

    handleInteraction(type, targetObject) {
      // Aturan 1 & 3: Seluruh interaksi [E] dikunci mati selama komunikasi (monolog, telepon, atau radio HT) berlangsung
      if (this.game.isCommunicationActive || this.game.isMayaSpeaking || this.isRadioTransmitting) {
        return false;
      }
      const objName = (targetObject && targetObject.name) ? targetObject.name : '';

      if (type === 'sector2_breaker_lever' || objName === 'powerBreakerLever') {
        if (!this.isBreachCountdownFinished && !this.isSector2LeverReady) {
          this.game._playProceduralClickSfx(140);
          this.game.showHUDWarning('Tunggu aba-aba Dhafir lewat radio!');
          return true;
        }
        this._pullSector2BreakerLever();
        return true;
      }

      if (type === 'floor1_stair_exit_door') {
        this._openFloor1StaffEntryDoor();
        return true;
      }

      if (type === 'radio_ht' && !this.hasPickedUpRadioHT) {
        this._pickupRadioHTAndStartDhafirSequence();
        return true;
      }

      if (type === 'floor1_double_door') {
        if (!this.hasPickedUpRadioHT) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Ambil Radio HT di atas meja keamanan terlebih dahulu!');
          return true;
        }
        if (!this.isFloor1DoubleDoorUnlocked) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Tunggu instruksi radio Dhafir selesai untuk membuka kunci pintu ini!');
          return true;
        }
        if (this.isPlayerTrappedInArchive && !this.isArchiveExitBreached) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Pintu hidrolik terkunci rapat dari luar! Tunggu Dhafir mendobrak pintu arsip!');
          return true;
        }
        return true;
      }

      if (type === 'archive_hydraulic_door') {
        if (!this.isArchiveExitBreached) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Terkunci magnetik! Tunggu Dhafir menembak engsel pintu dari luar!');
          return true;
        }
        return true;
      }

      if (type === 'main_lobby_glass_exit') {
        if (this.isLobbyPillarCollapsed) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Jalur lobi tertimbun pilar runtuh! Belok kanan ke Ruang Kontrol Keamanan!');
          return true;
        }
        this._triggerMainLobbyDawnEscape();
        return true;
      }

      if (type === 'security_hub_door') {
        if (this.canUnlockSecurityHubDoorToExit) {
          this._openSecurityHubDoorToCargoHall();
          return true;
        }
        if (this.isSecurityHubDoorLocked) {
          this.game._playProceduralClickSfx(110);
          this.game.showHUDWarning('Gerendel baja manual terkunci rapat — tunggu instruksi Dhafir!');
          return true;
        }
        this._lockSecurityHubDoorAndStartCode0();
        return true;
      }

      if (type === 'main_gate_console') {
        this._triggerMainLobbyDawnEscape();
        return true;
      }

      if (type === 'tactical_apc_entry') {
        this._enterTacticalApcCabinSequence();
        return true;
      }

      if (type === 'stairwell_key' && !this.hasMaintenanceKey) {
        this._pickupMaintenanceKeyAndTriggerTrap();
        return true;
      }

      if (type === 'maintenance_3b_door') {
        this._interactMaintenance3BDoor();
        return true;
      }

      if (type === 'room_304_door') {
        if (this.isRoom304TrapLocked) {
          this.game._playProceduralClickSfx(95);
          this.game.showHUDWarning('Pintu Kamar 304 terkunci rapat! Hadapi entitas dengan memalingkan pandangan & berkedip [SPACE]!');
          return true;
        }
        this._openRoom304DoorWider();
        return true;
      }

      if (type === 'lobby_window') {
        if (!this.areCurtainsOpen && !this.isCurtainAnimating) {
          this._openWindowCurtains();
        } else if (this.areCurtainsOpen && !this.isCurtainAnimating) {
          this._inspectLobbyWindow();
        }
        return true;
      }
      if (type === 'cctv_monitor') {
        this._inspectCctvMonitor();
        return true;
      }
      if (type === 'generator_lever') {
        if (!this.isGeneratorRunning) {
          this._pullGeneratorLever();
        }
        return true;
      }
      if (type === 'basement_access_door') {
        this.game._playProceduralClickSfx(180);
        this.game.showTemporarySubtitle(
          'MAYA',
          'Pintu besi menuju tangga basement terbuka. Gelap sekali di bawah sana... gunakan senter [F].',
          3500
        );
        return true;
      }
      if (type === 'elevator') {
        if (this.isElevatorPowered) {
          this._openPoweredLobbyElevator();
        } else {
          this._inspectBrokenElevator();
        }
        return true;
      }
      if (type === 'elevator_cabin_panel') {
        if (this.isElevatorPowered && !this.isElevatorDescending && !this.isOnFloorTwo) {
          this._activateElevatorCabinDescentAndCrash();
        }
        return true;
      }
      if (type === 'barricaded_stairs') {
        this._inspectBarricadedStairs();
        return true;
      }
      if (type === 'room_305_knock') {
        this._knockRoom305Neighbor();
        return true;
      }
      if (type === 'room_307_knock') {
        this._knockRoom307Entity();
        return true;
      }
      if (type === 'floor2_padlock') {
        this._interactFloor2Padlock();
        return true;
      }
      if (type === 'room201_memo') {
        this._inspectRoom201Memo();
        return true;
      }
      if (type === 'floor2_breaker') {
        this._turnOffFloor2Breaker();
        return true;
      }
      if (type === 'wall_digit_7') {
        this._inspectWallDigit7();
        return true;
      }
      if (type === 'room205_memo') {
        this._inspectRoom205Memo();
        return true;
      }

      return false;
    }

    _playExactTimedMonologue(filePath, exactDurationMs, speaker, subtitleText, onDoneCallback) {
      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
        this.activeMonologueTimer = null;
      }

      this.game.setMayaSpeaking(true);
      this.game.showSubtitle(speaker, subtitleText, false);
      this.game._playAudioWithFallback(filePath, exactDurationMs, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.game.hideSubtitle();
        this.game.setMayaSpeaking(false);
        this.isActionBusy = false;
        this.activeMonologueTimer = null;
        if (typeof onDoneCallback === 'function') {
          onDoneCallback();
        }
      }, exactDurationMs);
    }

    _openWindowCurtains() {
      this.isCurtainAnimating = true;
      this.curtainAnimStart = performance.now();
      this.game.playOneShotSfx('assets/audio/sfx_curtain_open.mp3');
      this.game._setInteractionPrompt('');
    }

    _inspectLobbyWindow() {
      this.isActionBusy = true;
      if (this.skyFlashLight) {
        this.skyFlashLight.intensity = 1.85;
      }
      this._playExactTimedMonologue(
        'assets/audio/maya_inspect_window.mp3',
        10000,
        'MAYA',
        'Ibu benar... nggak ada satu pun lampu menyala di seluruh kota. Nggak ada mobil, nggak ada sirene... cuma kegelapan tanpa ujung.'
      );
    }

    _inspectBrokenElevator() {
      this.isActionBusy = true;

      if (this.elevatorSparkLight) {
        this.elevatorSparkLight.intensity = 4.2;
        this.game.setPauseAwareTimeout(() => {
          if (this.elevatorSparkLight) this.elevatorSparkLight.intensity = 0;
        }, 320);
      }

      this.game.playOneShotSfx('assets/audio/sfx_elevator_spark.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._playExactTimedMonologue(
          'assets/audio/maya_inspect_elevator.mp3',
          8000,
          'MAYA',
          'Panelnya korsleting... lift ini mati total. Aku nggak mau ambil risiko terjebak di lorong itu.'
        );
      }, 500);
    }

    _inspectBarricadedStairs() {
      this.isActionBusy = true;
      this._playExactTimedMonologue(
        'assets/audio/maya_inspect_stairs.mp3',
        11000,
        'MAYA',
        'Mereka membarikade seluruh tangga ini... furnitur, kawat patah, semuanya. Apa pun yang naik dari lantai bawah... mereka berusaha menahannya.'
      );
    }

    _openRoom304DoorWider() {
      if (this.isRoom304Animating || this.room304TargetAngle >= 1.4) return;
      this.isRoom304Animating = true;
      this.room304AnimStart = performance.now();
      this.game._playProceduralClickSfx(185);
      this.game._setInteractionPrompt('');
    }

    _knockRoom305Neighbor() {
      this.isActionBusy = true;
      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._playExactTimedMonologue(
          'assets/audio/sfx_neighbor_fear.mp3',
          8000,
          'TETANGGA KAMAR 305',
          'Pergi! Siapa pun di luar sana, jangan ketuk pintu ini lagi! Makhluk itu mendengar suara kalian!'
        );
      }, 950);
    }

    _knockRoom307Entity() {
      this.isActionBusy = true;
      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.room307ThudTimer = 1.8;
        this._playExactTimedMonologue(
          'assets/audio/sfx_door_thud.mp3',
          2600,
          'KAMAR 307',
          '[ Suara benturan berat dari balik pintu... tidak ada jawaban ]'
        );
      }, 1000);
    }

    /**
     * Sekuens Masuk Kamar 304 (Proximity Trigger di Ambang Pintu)
     */
    _triggerRoom304EnterSequence() {
      if (this.hasEnteredRoom304) return;
      this.hasEnteredRoom304 = true;
      this.isActionBusy = true;

      this.game.setObjective('Cari kunci tangga darurat di dalam kamar 304.');
      this._playExactTimedMonologue(
        'assets/audio/maya_room304_enter.mp3',
        8000,
        'MAYA',
        'Baunya busuk di sini... kayak air tergenang dan karat. Pasti ada kunci darurat di suatu tempat.'
      );
    }

    /**
     * 4. Revisi Kunci Kamar 304 ("Ruang Panel 3B / Maintenance 3B") & Jebakan Pintu Terbanting
     */
    _pickupMaintenanceKeyAndTriggerTrap() {
      if (this.hasMaintenanceKey) return;
      this.hasMaintenanceKey = true;
      this.hasStairwellKey = true;
      this.game.hasMaintenanceKey = true;
      this.game.hasStairwellKey = true;

      if (this.stairwellKeyMesh) {
        this.stairwellKeyMesh.visible = false;
        this.scene.remove(this.stairwellKeyMesh);
      }
      this.game._setInteractionPrompt('');

      if (this.game.keyHudBadge) {
        this.game.keyHudBadge.textContent = 'KUNCI PANEL 3B: DITEMUKAN';
        this.game.keyHudBadge.classList.add('active-badge');
      }

      // Putar SFX ambil kunci
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');

      // Pintu Kamar 304 membanting tertutup rapat (rotation.y = 0) & terkunci otomatis
      this.isRoom304Animating = false;
      this.isRoom304Open = false;
      this.isRoom304TrapLocked = true;
      if (this.room304DoorPivot) {
        this.room304DoorPivot.rotation.y = 0;
      }

      // Camera shake tajam 0.6 detik + sfx_door_slam.mp3
      this.game.cameraShakeDuration = 0.6;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.068;
      this.game.playOneShotSfx('assets/audio/sfx_door_slam.mp3');

      // Pertama-tama jalankan monolog frustrasi Maya memeriksa kunci: maya_examine_key_fix.mp3 (10000ms)
      this.isActionBusy = true;
      this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');

      this._playExactTimedMonologue(
        'assets/audio/maya_examine_key_fix.mp3',
        10000,
        'MAYA',
        "Tunggu... ini bukan kunci tangga darurat. Tulisannya 'Ruang Panel 3B'. Ruang utilitas di seberang lobi... kunci magnetik tangga pasti dikontrol dari sana.",
        () => {
          // Dilanjutkan monolog panik pintu terkunci: maya_door_slam.mp3 (10000ms)
          this.isActionBusy = true;
          this._playExactTimedMonologue(
            'assets/audio/maya_door_slam.mp3',
            10000,
            'MAYA',
            'Nggak, buka! Jangan sekarang... dia ada di dalam sini bersamaku...'
          );

          // Munculkan entitas bayangan bermata merah di dalam Kamar 304
          this.game.setPauseAwareTimeout(() => {
            if (this.game.isDisposed) return;
            this._spawnRoom304Entity();
          }, 3500);
        }
      );
    }

    _spawnRoom304Entity() {
      if (!this.roomEntityMesh) return;
      this.roomEntityMesh.position.set(14.85, 0, -16.25);
      this.roomEntityMesh.visible = true;
      this.isRoom304EntityActive = true;
      this.room304BlinkCount = 0;
      this.game.setObjective('Jangan tatap mata merahnya! Palingkan pandangan lalu tekan [SPACE] 2x untuk berkedip.');
    }

    /**
     * Ketika Maya menekan [Spacebar] untuk berkedip:
     * - Di Kamar 304: posisi sepasang mata merah berpindah sekejap mendekat/bergeser sudutnya
     *   diiringi audio desis dingin sfx_entity_breathing_dark.mp3. Pada kedipan ke-2, entitas lenyap.
     * - Di Koridor Luar: jika entitas mata merah koridor aktif, posisinya juga bergeser diiringi
     *   sfx_entity_breathing_dark.mp3.
     */
    onPlayerBlink() {
      // Menekan [Spacebar] untuk berkedip mereset tingkat agresivitas tatapan fatal monster!
      this.gazeLockTimer = 0;
      this._setFatalGazeOverlayState('none', 0);

      if (this.isStalkerEntityActive && this.stalkerShadowEntity && this.stalkerShadowEntity.visible) {
        this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');
        const shiftX = (Math.random() - 0.5) * 1.3;
        this.stalkerShadowEntity.position.x = Math.max(1.8, Math.min(8.8, this.stalkerShadowEntity.position.x + shiftX));
      }

      if (this.isWestWingMonsterActive && this.westWingCargoEntity && this.westWingCargoEntity.visible) {
        this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');
        const shiftX = (Math.random() - 0.5) * 1.6;
        this.westWingCargoEntity.position.x = Math.max(-9.2, Math.min(0.8, this.westWingCargoEntity.position.x + shiftX));
      }

      if (this.isCorridorRedEyesActive && this.corridorRedEyesEntity && this.corridorRedEyesEntity.visible) {
        this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');
        // Geser sudut/posisi mata merah di koridor sekejap saat mata tertutup
        const offsetX = (Math.random() - 0.5) * 1.4;
        this.corridorRedEyesEntity.position.x = 6.4 + offsetX;
        this.corridorRedEyesEntity.position.z = Math.max(-13.8, this.corridorRedEyesEntity.position.z - 0.65);
      }

      if (!this.isRoom304EntityActive) return;

      if (this.isLookingAtRoomEntity) {
        this.game.showTemporarySubtitle(
          'PERINGATAN',
          'Jangan menatap mata merah itu! Palingkan pandangan ke lantai/samping lalu tekan [SPACE]!',
          2200
        );
        return;
      }

      this.room304BlinkCount += 1;
      // Putar audio desis dingin saat entitas berpindah posisi ketika berkedip
      this.game.playOneShotSfx('assets/audio/sfx_entity_breathing_dark.mp3');

      if (this.room304BlinkCount === 1) {
        // Kedipan ke-1: posisi sepasang mata merah berpindah sekejap mendekat & bergeser sudutnya
        if (this.roomEntityMesh) {
          this.roomEntityMesh.position.set(14.25, 0, -16.85);
          this.roomEntityHeadWorldPos.set(14.25, 2.06, -16.85);
        }
        this.game.setObjective('Kedip sekali lagi [SPACE] sambil tetap memalingkan pandangan (1/2)!');
      } else if (this.room304BlinkCount >= 2) {
        this._resolveRoom304EntityEncounter();
      }
    }

    _resolveRoom304EntityEncounter() {
      this.isRoom304EntityActive = false;
      this.isLookingAtRoomEntity = false;
      this._stopStaticBuzz();

      if (this.game.vignetteLayerEl) {
        this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
      }

      this.game.playOneShotSfx('assets/audio/sfx_entity_screech_short.mp3');

      if (this.roomEntityMesh) {
        this.roomEntityMesh.visible = false;
      }

      // Pintu Kamar 304 terbuka kembali sedikit (unlocked)
      this.isRoom304TrapLocked = false;
      this.isRoom304Open = true;
      this.room304TargetAngle = 0.65;
      if (this.room304DoorPivot) {
        this.room304DoorPivot.rotation.y = 0.65;
      }

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isActionBusy = true;
        this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');
        this._playExactTimedMonologue(
          'assets/audio/maya_got_key.mp3',
          8000,
          'MAYA',
          'Kunci tangga darurat! Aku harus keluar dari kamar ini sekarang juga.'
        );
      }, 650);
    }

    /**
     * Kemunculan Mata Merah di Koridor Luar saat pemain melangkah keluar Kamar 304
     */
    _triggerCorridorRedEyesEvent() {
      if (this.hasTriggeredCorridorRedEyes || this.game.isDisposed) return;
      this.hasTriggeredCorridorRedEyes = true;
      this.isCorridorRedEyesActive = true;

      // 1. Lampu darurat lobi tiba-tiba padam berderak
      if (this.lobbyNeonLight) {
        this.lobbyNeonLight.intensity = 0.08;
      }
      if (this.lobbyNeonMat) {
        this.lobbyNeonMat.emissiveIntensity = 0.02;
      }
      this.lobbyEmergencyLights.forEach((item) => {
        item.light.intensity = 0.05;
        item.lensMat.emissiveIntensity = 0.08;
      });

      // 2. Di ujung lorong seberang dekat pintu lift, muncul sepasang mata merah menyala menatap dingin ke arah Maya
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.position.set(6.4, 0, -11.4);
        this.corridorRedEyesEntity.visible = true;
      }

      // 3. Putar audio SFX atmosferik: assets/audio/sfx_red_eyes_appear.mp3
      this.game.playOneShotSfx('assets/audio/sfx_red_eyes_appear.mp3');

      // 4. Jalankan monolog bisikan Maya (maya_spot_red_eyes.mp3 — durasi presisi 12000ms, isMayaSpeaking = true)
      this.isActionBusy = true;
      this._playExactTimedMonologue(
        'assets/audio/maya_spot_red_eyes.mp3',
        12000,
        'MAYA [BERBISIK]',
        'Mata itu... menyala di kegelapan. Jangan tatap langsung. Jangan buat suara sedikit pun.',
        () => {
          this.game.setObjective('Menyeberang ke Ruang Panel 3B di seberang lobi lift untuk membuka kunci magnetik tangga.');
        }
      );
    }

    /**
     * Interaksi Pintu Ruang Panel 3B ("MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY")
     */
    _interactMaintenance3BDoor() {
      if (this.isMaintenance3BOpen || this.isMaintenance3BAnimating) return;

      if (!this.hasMaintenanceKey) {
        this.game._playProceduralClickSfx(95);
        this.game.showTemporarySubtitle(
          'MAYA',
          'Pintunya terkunci rapat. Bertuliskan "MAINTENANCE 3B - AUTHORIZED PERSONNEL ONLY". Aku butuh kuncinya.',
          3500
        );
        return;
      }

      // Buka kunci pintu Maintenance 3B
      this.isMaintenance3BAnimating = true;
      this.maintenance3BAnimStart = performance.now();
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.game._setInteractionPrompt('');

      // Lenyapkan entitas mata merah di lobi saat Maya berhasil masuk ke Ruang Panel 3B
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.visible = false;
        this.isCorridorRedEyesActive = false;
      }

      this.game.showTemporarySubtitle(
        'MAYA',
        'Kunci Ruang Panel 3B cocok! Pintunya terbuka.',
        3500
      );
      this.game.setObjective('Masuk ke dalam Ruang Panel 3B dan aktifkan sakelar pembuka kunci magnetik tangga darurat.');
    }

    /**
     * Membuat elemen DOM overlay untuk peringatan distorsi kromatik/vignette merah tajam
     * dan layar Jumpscare Game Over hitam berdarah saat Tatapan Fatal (> 0.8 detik).
     */
    _ensureFatalGazeOverlayDOM() {
      if (this.fatalGazeOverlayEl) return;
      let el = document.getElementById('fatal-gaze-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'fatal-gaze-overlay';
        el.style.cssText = [
          'position:fixed',
          'inset:0',
          'pointer-events:none',
          'z-index:920',
          'opacity:0',
          'transition:opacity 0.12s ease',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'text-align:center',
          'font-family:"Cinzel",serif'
        ].join(';');
        el.innerHTML = '<div id="fatal-gaze-text" style="color:#ff1a1a;font-size:1.75rem;letter-spacing:0.18em;text-shadow:0 0 18px #ff0000, -3px 0 #ff0044, 3px 0 #00e5ff;opacity:0;padding:0 24px;">JANGAN TATAP MATA MERAHNYA</div>';
        document.body.appendChild(el);
      }
      this.fatalGazeOverlayEl = el;
    }

    _setFatalGazeOverlayState(mode, intensity) {
      this._ensureFatalGazeOverlayDOM();
      if (!this.fatalGazeOverlayEl) return;
      const textEl = document.getElementById('fatal-gaze-text');

      if (mode === 'none') {
        this.fatalGazeOverlayEl.style.opacity = '0';
        this.fatalGazeOverlayEl.style.background = 'transparent';
        this.fatalGazeOverlayEl.style.boxShadow = 'none';
        if (textEl) textEl.style.opacity = '0';
      } else if (mode === 'warning') {
        const alpha = Math.min(0.95, 0.35 + intensity * 0.65);
        this.fatalGazeOverlayEl.style.opacity = String(alpha);
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(255,0,20,0.08) 32%, rgba(165,0,15,0.68) 78%, rgba(65,0,0,0.94) 100%)';
        this.fatalGazeOverlayEl.style.boxShadow =
          'inset 0 0 95px rgba(255, 0, 0, 0.85), inset -6px 0 18px rgba(255,0,60,0.55), inset 6px 0 18px rgba(0,220,255,0.38)';
        if (textEl) {
          textEl.textContent = 'TUNDUKKAN KEPALA — JANGAN TATAP MATANYA!';
          textEl.style.fontSize = '1.15rem';
          textEl.style.opacity = String(Math.min(1, intensity * 1.15));
        }
      } else if (mode === 'gameover') {
        this.fatalGazeOverlayEl.style.opacity = '1';
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(120,0,0,0.92) 15%, rgba(28,0,0,0.98) 60%, #020000 100%)';
        this.fatalGazeOverlayEl.style.boxShadow = 'inset 0 0 160px #ff0000';
        if (textEl) {
          textEl.innerHTML = 'TATAPAN FATAL<br><span style="font-size:0.95rem;letter-spacing:0.12em;color:#fca5a5;">MEMULIHKAN DARI CHECKPOINT TERDEKAT...</span>';
          textEl.style.fontSize = '2.1rem';
          textEl.style.opacity = '1';
        }
      }
    }

    /**
     * 2. Mekanik Tatapan Fatal (Fatal Gaze Attack System):
     * - Menghitung sudut arah pandang kamera (camera.getWorldDirection) terhadap posisi sepasang mata merah entitas.
     * - Jika dot product terpusat pada mata merah (> 0.88) dan kamera tidak menunduk ke lantai:
     *   * Putar peringatan sfx_eye_lock_warning.mp3, layar bergetar, dan muncul distorsi kromatik/vignette merah tajam.
     *   * Jika terus menatap > 0.8 detik tanpa memalingkan pandangan:
     *     Monster beralih ke Fase Serangan Agresif (The Charge), putar sfx_creature_attack_scream.mp3,
     *     melesat instan ke wajah pemain, layar menjadi hitam berdarah (Jumpscare Game Over), lalu reset ke checkpoint terdekat.
     *   * Saat pertama kali memicu deteksi tatapan dan berhasil memalingkan pandangan tepat waktu:
     *     Putar monolog bisikan Maya: maya_stare_warning.mp3 (10000ms, isMayaSpeaking = true).
     */
    _updateEntityGazeCheck(delta, elapsed) {
      const THREE = window.THREE;
      const camPos = this.game.camera ? this.game.camera.position : null;
      if (!camPos) return;

      // Simpan checkpoint terdekat secara berkala saat aman
      if (!this.isFatalAttackInProgress && this.gazeLockTimer === 0) {
        if (this.isGeneratorRunning && camPos.z > -22.5) {
          this.lastCheckpoint = { x: 2.9, y: 1.68, z: -18.2, yaw: 0 };
        } else if (camPos.z < -35.0) {
          this.lastCheckpoint = { x: 3.9, y: -2.72, z: -37.2, yaw: 0 };
        } else if (this.isRoom304EntityActive) {
          this.lastCheckpoint = { x: 15.6, y: 1.68, z: -17.6, yaw: Math.PI };
        }
      }

      // Jika sedang dalam Fase Serangan Agresif (The Charge), animasikan entitas melesat ke wajah pemain
      if (this.isFatalAttackInProgress) {
        this.fatalAttackTimer += delta;
        if (this.fatalAttackEntity && this.game.camera) {
          const forward = new THREE.Vector3();
          this.game.camera.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() > 0.001) forward.normalize();
          const targetX = camPos.x + forward.x * 0.52;
          const targetZ = camPos.z + forward.z * 0.52;
          const targetY = camPos.y - 2.02;
          this.fatalAttackEntity.position.x += (targetX - this.fatalAttackEntity.position.x) * Math.min(1, delta * 26);
          this.fatalAttackEntity.position.y += (targetY - this.fatalAttackEntity.position.y) * Math.min(1, delta * 26);
          this.fatalAttackEntity.position.z += (targetZ - this.fatalAttackEntity.position.z) * Math.min(1, delta * 26);
          this.fatalAttackEntity.lookAt(camPos.x, this.fatalAttackEntity.position.y + 2.06, camPos.z);
        }
        return;
      }

      // Kumpulkan daftar entitas bayangan bermata merah yang sedang aktif & terlihat
      const activeEntities = [];
      if (!this.isOnFloorTwo) {
        if (this.roomEntityMesh && this.roomEntityMesh.visible && this.isRoom304EntityActive) {
          activeEntities.push(this.roomEntityMesh);
        }
        if (this.corridorRedEyesEntity && this.corridorRedEyesEntity.visible && this.isCorridorRedEyesActive) {
          activeEntities.push(this.corridorRedEyesEntity);
        }
        if (this.stalkerShadowEntity && this.stalkerShadowEntity.visible && this.isStalkerEntityActive) {
          activeEntities.push(this.stalkerShadowEntity);
        }
      } else {
        if (this.floor2ReflectionEntity && this.floor2ReflectionEntity.visible) {
          activeEntities.push(this.floor2ReflectionEntity);
        }
        if (this.floor2ChaseEntity && this.floor2ChaseEntity.visible && this.isFloor2WaterChaseActive) {
          activeEntities.push(this.floor2ChaseEntity);
        }
        if (this.floor1LobbyEntity && this.floor1LobbyEntity.visible) {
          activeEntities.push(this.floor1LobbyEntity);
        }
        if (this.westWingCargoEntity && this.westWingCargoEntity.visible && this.isWestWingMonsterActive) {
          activeEntities.push(this.westWingCargoEntity);
        }
      }

      activeEntities.forEach((ent) => {
        updateShadowEntityVertices(ent, elapsed);
        ent.lookAt(camPos.x, ent.position.y, camPos.z);
      });

      if (activeEntities.length === 0) {
        if (this.gazeLockTimer > 0) {
          this.gazeLockTimer = 0;
          this._setFatalGazeOverlayState('none', 0);
          this._stopStaticBuzz();
        }
        return;
      }

      const camDir = new THREE.Vector3();
      this.game.camera.getWorldDirection(camDir);

      // Cari entitas aktif yang paling terpusat di reticle pandangan pemain
      let bestDot = -1;
      let targetEntity = null;
      for (let i = 0; i < activeEntities.length; i++) {
        const ent = activeEntities[i];
        const eyeWorldPos = new THREE.Vector3(ent.position.x, ent.position.y + 2.06, ent.position.z);
        const dist = camPos.distanceTo(eyeWorldPos);
        if (dist > 15.5) continue;

        const toEyes = eyeWorldPos.sub(camPos).normalize();
        const d = camDir.dot(toEyes);
        if (d > bestDot) {
          bestDot = d;
          targetEntity = ent;
        }
      }

      // 5. SISTEM PANTULAN AIR (WATER REFLECTION HAZARD) DI LANTAI 2:
      // Jika pemain menunduk di dekat entitas Koridor Utara Lantai 2 tetapi kursor kamera tepat menatap
      // pantulan sepasang mata merah di permukaan air (waterReflectionEyesGroup), peringatan tatapan terpicu!
      let isLookingAtWaterReflection = false;
      if (
        this.isOnFloorTwo &&
        this.floor2ReflectionEntity &&
        this.floor2ReflectionEntity.visible &&
        this.waterReflectionEyesGroup
      ) {
        // Posisi pantulan mengikuti titik tengah optik di permukaan air di depan monster
        const entPos = this.floor2ReflectionEntity.position;
        const reflX = entPos.x - 1.15;
        const reflZ = entPos.z;
        this.waterReflectionEyesGroup.position.set(reflX, 0.085, reflZ);

        const reflWorldPos = new THREE.Vector3(reflX, 0.085, reflZ);
        const distToRefl = camPos.distanceTo(reflWorldPos);
        if (distToRefl <= 10.5 && camPos.z <= -19.5) {
          const toReflection = reflWorldPos.sub(camPos).normalize();
          const reflDot = camDir.dot(toReflection);
          if (reflDot >= 0.87 && camDir.y < -0.08) {
            isLookingAtWaterReflection = true;
            bestDot = Math.max(bestDot, reflDot);
            targetEntity = this.floor2ReflectionEntity;

            // Saat pertama kali pemain memicu pantulan air ini, putar maya_reflection_warning.mp3 (9000ms)
            if (!this.hasPlayedReflectionWarningMonologue && !this.game.isMayaSpeaking) {
              this.hasPlayedReflectionWarningMonologue = true;
              this.reflectionGraceTimer = 2.2;
              this._playExactTimedMonologue(
                'assets/audio/maya_reflection_warning.mp3',
                9000,
                'MAYA',
                'Tunggu... mata merah itu... memantul di genangan air! Jangan lihat ke arah airnya!'
              );
            }
          }
        }
      }

      if (this.reflectionGraceTimer > 0) {
        this.reflectionGraceTimer = Math.max(0, this.reflectionGraceTimer - delta);
      }

      // Cara Menghindar (Counter-Play): menundukkan kepala ke lantai memutus kontak mata KECUALI menatap pantulan air!
      const isLookingDownAtFloor = (camDir.y < -0.25 || this.game.pitch < -0.25) && !isLookingAtWaterReflection;
      const isEyeLocked = Boolean(targetEntity && bestDot >= 0.86 && !isLookingDownAtFloor);

      if (isEyeLocked) {
        this.isLookingAtRoomEntity = true;
        this.hasTriggeredGazeWarningInSession = true;
        const sprintHazardMult = (this.isOnFloorTwo && this.game.isSprinting) ? 1.65 : 1.0;
        if (this.reflectionGraceTimer <= 0) {
          this.gazeLockTimer += delta * sprintHazardMult;
        }

        // Putar peringatan awal sfx_eye_lock_warning.mp3
        const nowMs = performance.now();
        if (nowMs - this.lastEyeLockWarningAt > 1350) {
          this.lastEyeLockWarningAt = nowMs;
          this.game.playOneShotSfx('assets/audio/sfx_eye_lock_warning.mp3');
        }

        // Layar bergetar & muncul distorsi kromatik / vignette merah tajam
        if (this.game.vignetteLayerEl) {
          this.game.vignetteLayerEl.classList.add('whisper-terror-vignette');
        }
        this.game.camera.rotation.z = (Math.random() - 0.5) * 0.055;
        this._setFatalGazeOverlayState('warning', Math.min(1, this.gazeLockTimer / 0.8));
        this._startOrUpdateStaticBuzz(Math.min(1, (bestDot - 0.82) * 6.0));

        // Jika pemain terus menatap selama lebih dari 0.8 detik tanpa memalingkan pandangan -> SERANGAN FATAL!
        if (this.gazeLockTimer >= 0.8) {
          this._triggerFatalGazeAttack(targetEntity);
        }
      } else {
        // Jika baru saja memicu peringatan tatapan pertama kali dan berhasil memalingkan pandangan tepat waktu:
        if (
          this.hasTriggeredGazeWarningInSession &&
          !this.hasPlayedStareWarningMonologue &&
          this.gazeLockTimer > 0.06 &&
          !this.game.isMayaSpeaking
        ) {
          this.hasPlayedStareWarningMonologue = true;
          this._playExactTimedMonologue(
            'assets/audio/maya_stare_warning.mp3',
            10000,
            'MAYA [BERBISIK]',
            'Dia bereaksi pada mataku... tundukkan kepala. Jangan tatap wajahnya, lihat ke lantai!'
          );
        }

        this.isLookingAtRoomEntity = false;
        this.gazeLockTimer = Math.max(0, this.gazeLockTimer - delta * 2.8);
        if (this.gazeLockTimer <= 0.01) {
          this.gazeLockTimer = 0;
          this._setFatalGazeOverlayState('none', 0);
          if (this.game.vignetteLayerEl) {
            this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
          }
          this._stopStaticBuzz();
        } else {
          this._setFatalGazeOverlayState('warning', this.gazeLockTimer / 0.8);
        }
      }
    }

    /**
     * Fase Serangan Agresif (The Charge):
     * - Putar jeritan distorsi ekstrem: assets/audio/sfx_creature_attack_scream.mp3
     * - Entitas melesat instan ke wajah pemain, layar menjadi hitam berdarah (Jumpscare Game Over),
     *   lalu sistem mereset posisi pemain ke checkpoint terdekat.
     */
    _triggerFatalGazeAttack(entity) {
      if (this.isFatalAttackInProgress) return;
      this.isFatalAttackInProgress = true;
      this.fatalAttackTimer = 0;
      this.fatalAttackEntity = entity;
      this.isCutsceneLocked = true;
      this._stopStaticBuzz();

      // Putar jeritan distorsi ekstrem: assets/audio/sfx_creature_attack_scream.mp3
      this.game.playOneShotSfx('assets/audio/sfx_creature_attack_scream.mp3');

      // Guncang kamera hebat & aktifkan layar Jumpscare Game Over hitam berdarah
      this.game.cameraShakeDuration = 0.9;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.11;

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._setFatalGazeOverlayState('gameover', 1.0);
      }, 160);

      // Reset posisi pemain ke checkpoint terdekat setelah 2.4 detik
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._respawnFromFatalGaze();
      }, 2400);
    }

    _respawnFromFatalGaze() {
      this.isFatalAttackInProgress = false;
      this.isCutsceneLocked = false;
      this.isActionBusy = false;
      if (this.game && typeof this.game.setMayaSpeaking === 'function') {
        this.game.setMayaSpeaking(false);
      }
      this.gazeLockTimer = 0;
      this._setFatalGazeOverlayState('none', 0);
      if (this.game.vignetteLayerEl) {
        this.game.vignetteLayerEl.classList.remove('whisper-terror-vignette');
      }

      // Kembalikan posisi entitas ke titik awalnya agar tidak menempel di wajah pemain
      if (this.roomEntityMesh && this.isRoom304EntityActive) {
        this.roomEntityMesh.position.set(14.85, 0, -16.25);
      }
      if (this.corridorRedEyesEntity && this.isCorridorRedEyesActive) {
        this.corridorRedEyesEntity.position.set(6.4, 0, -11.4);
      }
      if (this.stalkerShadowEntity && this.isStalkerEntityActive) {
        this.stalkerShadowEntity.position.set(5.4, 0, -13.2);
      }

      // Gunakan CheckpointManager.respawnPlayer() agar posisi & Euler rotasi kamera aman bebas tabrakan
      if (this.checkpointManager) {
        this.checkpointManager.respawnPlayer();
        if (this.game && this.game.camera) {
          this.game.pitch = -0.28;
          this.game.camera.rotation.x = -0.28;
        }
      } else if (this.game.camera && this.lastCheckpoint) {
        this.game.camera.position.set(
          this.lastCheckpoint.x,
          this.lastCheckpoint.y,
          this.lastCheckpoint.z
        );
        this.game.yaw = this.lastCheckpoint.yaw || 0;
        this.game.pitch = -0.28;
        this.game.camera.rotation.y = this.game.yaw;
        this.game.camera.rotation.x = this.game.pitch;
        this.game.camera.rotation.z = 0;
      }

      this.game.showTemporarySubtitle(
        'CHECKPOINT',
        'Jangan menatap mata merahnya! Tundukkan pandangan ke lantai atau tekan [SPACE] untuk berkedip.',
        4000
      );
    }

    /**
     * 3. Sekuens Membuka Pintu Lift Lobi Lantai 3 (sfx_elevator_bell.mp3)
     */
    _openPoweredLobbyElevator() {
      if (this.isElevatorDoorSequenceTriggered || this.isOnFloorTwo) return;
      this.isElevatorDoorSequenceTriggered = true;
      this.isElevatorCabinOpen = true;
      this.targetElevatorDoorFactor = 1.0;

      // Putar denting pintu lift: assets/audio/sfx_elevator_bell.mp3
      this.game.playOneShotSfx('assets/audio/sfx_elevator_bell.mp3');
      this.game._setInteractionPrompt('');

      // Sembunyikan entitas pengintai di lobi saat pintu lift terbuka
      if (this.stalkerShadowEntity) {
        this.stalkerShadowEntity.visible = false;
        this.isStalkerEntityActive = false;
      }
      if (this.corridorRedEyesEntity) {
        this.corridorRedEyesEntity.visible = false;
        this.isCorridorRedEyesActive = false;
      }

      this.game.setObjective('Masuk ke dalam kabin lift dan tekan tombol panel lantai dasar [E].');
    }

    /**
     * 3B & 4. Menekan Tombol Panel Lantai Dasar [E] di Dalam Kabin Lift
     * -> Monolog Lega Maya (maya_elevator_enter.mp3 — 12000ms)
     * -> Sekuens Lift Macet & Anjlok ke Lantai 2 (sfx_elevator_cable_snap.mp3 + maya_elevator_crash.mp3 — 7000ms)
     */
    _activateElevatorCabinDescentAndCrash() {
      if (this.isElevatorDescending || this.isOnFloorTwo) return;
      this.isElevatorDescending = true;
      this.isInsideElevatorCabin = true;
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // Posisikan pemain rapi di dalam kabin lift menghadap pintu lift
      if (this.game.camera) {
        this.game.camera.position.set(7.9, 1.68, -8.65);
        this.game.yaw = 0;
        this.game.pitch = 0;
        this.game.camera.rotation.y = 0;
        this.game.camera.rotation.x = 0;
      }

      // Pintu lift menutup rapat
      this.targetElevatorDoorFactor = 0.0;
      this.game._playProceduralClickSfx(320);

      // Putar monolog lega Maya: assets/audio/maya_elevator_enter.mp3 (Durasi presisi: 12000ms)
      this.game.setObjective('Tunggu lift turun menuju lantai dasar...');
      this._playExactTimedMonologue(
        'assets/audio/maya_elevator_enter.mp3',
        12000,
        'MAYA',
        'Panelnya menyala! Lantai satu... kumohon bawa aku ke lantai dasar.',
        () => {
          // 4. Tepat di akhir monolog maya_elevator_enter: Sekuens Lift Macet & Anjlok ke Lantai 2!
          this._triggerElevatorCableSnapAndCrashToFloorTwo();
        }
      );
    }

    _triggerElevatorCableSnapAndCrashToFloorTwo() {
      if (this.game.isDisposed) return;
      this.isActionBusy = true;

      // 1. Lampu neon di dalam kabin lift berkedip padam dan berubah menjadi lampu darurat merah redup
      if (this.cabinNeonLight) {
        this.cabinNeonLight.intensity = 0;
      }
      if (this.cabinNeonMat) {
        this.cabinNeonMat.emissive.setHex(0x330505);
        this.cabinNeonMat.emissiveIntensity = 0.08;
      }
      if (this.cabinEmergencyLight) {
        this.cabinEmergencyLight.intensity = 1.45;
      }

      // 2. Putar audio efek kabel meregang dan benturan keras: assets/audio/sfx_elevator_cable_snap.mp3
      this.game.playOneShotSfx('assets/audio/sfx_elevator_cable_snap.mp3');

      // 3. Guncang kamera hebat selama 1.2 detik
      this.game.cameraShakeDuration = 1.2;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.095;

      // 4. Kabin tersentak anjlok dan terhenti mendadak di Lantai 2
      this.isElevatorDescending = false;
      this.isOnFloorTwo = true;
      this._updateCabinFloorDisplay('2', '#ef4444');

      // Sembunyikan seluruh geometri Kamar & Lorong Lantai 3 serta aktifkan Lantai 2 & Lantai 1
      if (this.floorThreeRootGroup) {
        this.floorThreeRootGroup.visible = false;
      }
      if (this.game && this.game.floorThreeBedroomGroup) {
        this.game.floorThreeBedroomGroup.visible = false;
      }
      if (this.game && this.game.ceilingLight) {
        this.game.ceilingLight.visible = false;
      }
      if (this.game && this.game.hallwayNeonLight) {
        this.game.hallwayNeonLight.visible = false;
      }
      if (this.game && this.game.cornerEmergencyLight) {
        this.game.cornerEmergencyLight.visible = false;
      }
      if (this.floorTwoGroup) {
        this.floorTwoGroup.visible = true;
      }
      this.lastCheckpoint = { x: 7.9, y: 1.68, z: -8.65, yaw: 0 };

      // 5. Pintu kabin lift yang anjlok macet dan hanya terbuka setinggi 50 cm di bagian bawah!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.targetElevatorDoorFactor = 0.55;
        if (this.elevatorJammedShutterMesh) {
          this.elevatorJammedShutterMesh.visible = true;
          this.elevatorJammedShutterMesh.position.y = 1.40; // Menyisakan celah bawah 50 cm (y = 0.0 s/d 0.52m)
        }
      }, 450);

      // 6. Maya panik dan terbatuk: putar maya_elevator_crash.mp3 (Durasi presisi: 7000ms)
      this._playExactTimedMonologue(
        'assets/audio/maya_elevator_crash.mp3',
        7000,
        'MAYA',
        '[berteriak] Nggak, jangan! Kabelnya! [batuk] Pintunya terbuka... ini lantai berapa?!',
        () => {
          // 7. Perbarui objektif di HUD: merayap lewat bawah pintu lift [SHIFT / C]
          this.game.setObjective('Tekan [SHIFT] atau [C] untuk jongkok dan merayap keluar dari celah pintu lift (50 cm).');
        }
      );
    }

    /**
     * 2. Sekuens Merayap Keluar Lift ke Genangan Air Lantai 2 (maya_floor2_enter.mp3 — 13000ms)
     */
    _triggerFloor2CrawlExitSequence() {
      if (this.hasTriggeredFloor2EnterMonologue || this.game.isDisposed) return;
      this.hasTriggeredFloor2EnterMonologue = true;
      this.hasCrawledOutOfElevator = true;
      this.isActionBusy = true;

      this.game.playOneShotSfx('assets/audio/sfx_water_footsteps.mp3');
      this.lastCheckpoint = { x: 7.9, y: 1.68, z: -11.1, yaw: Math.PI / 2 };

      this.game.setObjective('Cari jalan keluar dan periksa pintu tangga darurat Lantai 2.');
      this._playExactTimedMonologue(
        'assets/audio/maya_floor2_enter.mp3',
        13000,
        'MAYA',
        'Air... seluruh lantai ini tergenang. Baunya menyengat sekali. Aku harus merayap lewat bawah pintu ini.'
      );
    }

    /**
     * 3A. Interaksi Gembok Kombinasi 3 Angka (padlockMesh) pada Pintu Tangga Darurat Lantai 2
     */
    _interactFloor2Padlock() {
      if (this.isPadlockUnlocked || this.isFloor2StairDoorSlammedSafe) return;

      if (!this.hasFullPadlockCode && !(this.hasDigit7 && this.hasDigits42)) {
        this.game._playProceduralClickSfx(140);
        this.game.showTemporarySubtitle(
          'PINTU TANGGA DARURAT',
          'Terkunci gembok kombinasi 3 angka. Butuh kode untuk membukanya.',
          3800
        );
        return;
      }

      // Kode 7-4-2 lengkap dimiliki! Buka gembok kombinasi & lepas rantai besi ke air
      this.isPadlockUnlocked = true;
      this.isChainsFalling = true;
      this.chainsFallTimer = 0;
      this.isActionBusy = true;
      this.game._setInteractionPrompt('');

      // 1. Putar audio interaksi gembok: assets/audio/sfx_padlock_click.mp3
      this.game.playOneShotSfx('assets/audio/sfx_padlock_click.mp3');

      // 2. Ayunkan pintu tangga darurat terbuka setelah gembok & rantai jatuh ke air (~850ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isFloor2StairDoorAnimating = true;
        this.floor2StairDoorAnimStart = performance.now();
        this.isFloor2StairDoorOpen = true;
      }, 850);

      // 3. Putar monolog lega terburu-buru: assets/audio/maya_padlock_solve.mp3 (Durasi presisi: 10000ms)
      this._playExactTimedMonologue(
        'assets/audio/maya_padlock_solve.mp3',
        10000,
        'MAYA',
        'Tujuh... empat... dua. Ayo terbuka! Ya! Berhasil!',
        () => {
          this.game.setObjective('Lari masuk ke bordes tangga darurat sekarang juga!');
        }
      );

      // 4. Sekuens Pengejaran Air (Water Dash Scare): Entitas melesat mengejar dari genangan air di belakang pemain!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed || this.isFloor2StairDoorSlammedSafe) return;
        this._startFloor2WaterDashChase();
      }, 1600);
    }

    _startFloor2WaterDashChase() {
      if (this.isFloor2WaterChaseActive || this.isFloor2StairDoorSlammedSafe) return;
      this.isFloor2WaterChaseActive = true;

      if (this.floor2ChaseEntity) {
        this.floor2ChaseEntity.position.set(13.2, 0, -11.1);
        this.floor2ChaseEntity.visible = true;
      }

      // Putar SFX langkah air kencang: assets/audio/sfx_water_dash_chase.mp3
      this.game.playOneShotSfx('assets/audio/sfx_water_dash_chase.mp3');
      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.045;
    }

    /**
     * Saat pemain melangkah masuk ke bordes tangga darurat Lantai 2 (x <= 3.75),
     * pintu besi terbanting menutup rapat, mengunci entitas di luar!
     */
    _slamFloor2EmergencyStairDoorSafe() {
      if (this.isFloor2StairDoorSlammedSafe) return;
      this.isFloor2StairDoorSlammedSafe = true;
      this.isFloor2WaterChaseActive = false;
      this.isFloor2StairDoorAnimating = false;

      if (this.floor2StairDoorPivot) {
        this.floor2StairDoorPivot.rotation.y = 0;
      }
      if (this.floor2ChaseEntity) {
        this.floor2ChaseEntity.visible = false;
      }

      this.game.playOneShotSfx('assets/audio/sfx_door_slam.mp3');
      this.game.setPauseAwareTimeout(() => {
        if (!this.game.isDisposed) {
          this.game.playOneShotSfx('assets/audio/sfx_door_thud.mp3');
        }
      }, 320);

      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.082;

      this.game.showTemporarySubtitle(
        'TANGGA DARURAT LANTAI 2',
        '[ Pintu besi tangga darurat terbanting menutup rapat, mengunci entitas bayangan di luar! ]',
        4500
      );
      this.lastCheckpoint = { x: 2.2, y: 1.68, z: -10.8, yaw: Math.PI };
      this.game.setObjective('Turuni tangga darurat menuju Lantai 1 (Area Staf).');
    }

    /**
     * 1. Membuka Pintu Keluar Darurat "Lantai 1 - Area Staf" di ujung bawah tangga darurat
     */
    _openFloor1StaffEntryDoor() {
      if (this.isFloor1EntryDoorOpen || this.isFloor1EntryDoorAnimating) return;
      this.isFloor1EntryDoorAnimating = true;
      this.floor1EntryDoorAnimStart = performance.now();
      this.isFloor1EntryDoorOpen = true;
      this.isOnFloorOne = true;

      this.game.playOneShotSfx('assets/audio/sfx_door_knock.mp3');
      this.game._setInteractionPrompt('');
      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 2.4, yaw: Math.PI };

      this.game.showTemporarySubtitle(
        'LANTAI 1 - AREA STAF',
        'Koridor staf lantai dasar... kering dan dingin. Ada meja pos keamanan di depan.',
        4200
      );
      this.game.setObjective('Telusuri koridor staf Lantai 1 dan periksa meja pos keamanan.');
    }

    /**
     * 2 & 3. Mengambil Unit Radio HT (radioHTMesh) & Memulai Sekuens Komunikasi Dua Arah Maya & Dhafir
     */
    _pickupRadioHTAndStartDhafirSequence() {
      if (this.hasPickedUpRadioHT) return;
      this.hasPickedUpRadioHT = true;
      this.isRadioRinging = false;

      // Putar audio interaksi pengambilan radio: assets/audio/sfx_radio_pickup.mp3
      this.game.playOneShotSfx('assets/audio/sfx_radio_pickup.mp3');

      // Sembunyikan radioHTMesh di atas meja keamanan
      if (this.radioHTMesh) {
        this.radioHTMesh.visible = false;
      }
      this.game._setInteractionPrompt('');

      // Aktifkan ikon / badge Radio HT di pojok HUD
      this.game.hasRadioHT = true;
      this.game._updateEquipmentHUD();

      // Kunci interaksi objek & ponsel secara ketat selama transmisi radio berlangsung
      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 7.8, yaw: Math.PI };
      this.game.setObjective('Dengarkan transmisi radio dari Dhafir [Interaksi Dikunci].');

      // Mulai sekuens berantai 4 bagian dialog radio Maya & Dhafir setelah sfx_radio_pickup (450ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._runDhafirMayaRadioChain(0);
      }, 450);
    }

    /**
     * Menjalankan 4 tahap dialog radio Maya & Dhafir secara berurutan (chain sequence)
     * sesuai durasi presisi masing-masing audio (11000ms -> 5000ms -> 11000ms -> 10000ms).
     */
    _runDhafirMayaRadioChain(stepIndex) {
      if (this.game.isDisposed) return;

      if (stepIndex >= DHAFIR_MAYA_RADIO_SEQUENCE.length) {
        // Seluruh 4 bagian dialog selesai:
        this.hasCompletedDhafirRadioDialog = true;
        this.isRadioTransmitting = false;
        this.isActionBusy = false;
        this.game.hideSubtitle();
        this.game.setRadioTransmitting(false);

        // Buka kunci pintu double-door di ujung lorong staf menuju ruang kontrol keamanan / koridor lobi
        this.isFloor1DoubleDoorUnlocked = true;
        this.isFloor1DoubleDoorAnimating = true;
        this.floor1DoubleDoorAnimStart = performance.now();

        if (this.floor1DoubleDoorLockMat) {
          this.floor1DoubleDoorLockMat.color.setHex(0x22c55e);
        }
        if (this.floor1DoubleDoorLockLight) {
          this.floor1DoubleDoorLockLight.color.setHex(0x22c55e);
        }
        if (this.floor1LobbyEntity) {
          this.floor1LobbyEntity.visible = true;
        }

        this.game.playOneShotSfx('assets/audio/sfx_padlock_click.mp3');

        // Perbarui objektif di HUD sesuai spesifikasi
        this.game.setObjective('Ikuti instruksi radio Dhafir menuju ruang kontrol keamanan Lantai 1.');
        return;
      }

      const step = DHAFIR_MAYA_RADIO_SEQUENCE[stepIndex];

      // Kunci interaksi & tampilkan subtitle Bahasa Indonesia
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(step.speaker, step.text, false);

      // 1. Putar SFX transmisi walkie-talkie: assets/audio/sfx_radio_click_chime.mp3
      this.game.playOneShotSfx(step.chimeSfx);

      // 2. Putar voice over sesuai file di assets/audio/
      this.game._playAudioWithFallback(step.file, step.duration, null);

      // 3. Tunggu sesuai durasi presisi (11000ms / 5000ms / 11000ms / 10000ms) sebelum lanjut ke tahap berikutnya
      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runDhafirMayaRadioChain(stepIndex + 1);
      }, step.duration);
    }

    /**
     * 3B. Game Over Instan saat Melangkah ke Zona Air Berlistrik (Box3 Trigger Zone)
     */

    /**
     * Pemicu Jebakan Ruang Arsip Lantai 1 (The Panic Archive Trap):
     * - Begitu seluruh badan pemain melangkah masuk melewati ambang pintu (z >= 18.35):
     *   * Pintu hidrolik terbanting menutup otomatis & mengunci jalan kembali ke lorong staf.
     *   * Putar SFX: assets/audio/sfx_door_slam_lock.mp3.
     *   * Kunci magnetik aktif (doorMesh.isLocked = true).
     *   * Mulai rangkaian sekuens audio radio 7 Babak Dhafir & Maya.
     */
    _triggerPanicArchiveTrap() {
      if (this.hasTriggeredArchiveTrap || this.game.isDisposed) return;
      this.hasTriggeredArchiveTrap = true;
      this.isPlayerTrappedInArchive = true;
      this.isArchiveDoorSlamAnimating = true;
      this.archiveDoorSlamStart = performance.now();

      // Aktifkan kunci magnetik pada pintu masuk & keluar ruang arsip
      if (this.archiveDoorMesh) {
        this.archiveDoorMesh.isLocked = true;
      }
      if (this.archiveExitDoorMesh) {
        this.archiveExitDoorMesh.isLocked = true;
      }
      if (this.floor1DoubleDoorLockMat) {
        this.floor1DoubleDoorLockMat.color.setHex(0xef4444);
      }
      if (this.floor1DoubleDoorLockLight) {
        this.floor1DoubleDoorLockLight.color.setHex(0xef4444);
      }

      // Putar SFX pintu hidrolik terbanting mengunci: assets/audio/sfx_door_slam_lock.mp3
      this.game.playOneShotSfx('assets/audio/sfx_door_slam_lock.mp3');

      // Efek guncangan kamera saat pintu baja terbanting menutup
      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.085;

      // Kunci interaksi objek luar & ponsel secara ketat (namun kamera & gerak di dalam ruangan tetap bebas!)
      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      if (this.checkpointManager) this.checkpointManager.setCheckpoint('CP_FLOOR_1_ARCHIVE');
      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 20.5, yaw: Math.PI };
      this.game.setObjective('Terjebak di Ruang Arsip Darurat — Dengarkan transmisi radio Dhafir.');

      // Mulai rangkaian dialog radio 7 Babak (Babak 1 s/d Babak 6) setelah dentuman pintu (650ms)
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this._runPanicArchiveRadioChain(0);
      }, 650);
    }

    /**
     * Menjalankan Rangkaian Dialog Radio Presisi (Babak 1 s/d Babak 6)
     * Setiap pergantian transmisi membunyikan klik PTT assets/audio/sfx_radio_click_chime.mp3.
     */
    _runPanicArchiveRadioChain(index) {
      if (this.game.isDisposed) return;

      if (index >= PANIC_ARCHIVE_RADIO_SEQUENCE.length) {
        this._triggerDhafirHingeGunshotBreach();
        return;
      }

      const item = PANIC_ARCHIVE_RADIO_SEQUENCE[index];

      // Pastikan flag penguncian interaksi aktif ketat selama percakapan berlangsung
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.objectiveOnStart) {
        this.game.setObjective(item.objectiveOnStart);
      }

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        if (item.triggerBreachAfter) {
          this._triggerDhafirHingeGunshotBreach();
        } else {
          this._runPanicArchiveRadioChain(index + 1);
        }
      }, item.duration);
    }

    /**
     * Babak 7: Tembakan Engsel Pintu oleh Dhafir & Pintu Tumbang Terbuka:
     * - Putar SFX tembakan baja: assets/audio/sfx_silenced_gunshots.mp3
     * - Efek guncangan kamera (camera shake) + partikel percikan api & asap pada engsel pintu
     * - Putar SFX pintu roboh: assets/audio/sfx_door_kick_open.mp3
     * - Animasi pintu terbuka/tumbang ke depan & hilangkan collider penghalang pintu
     * - Lanjutkan 3 dialog penutup Babak 7 (maya_cough_smoke -> dhafir_final_push -> maya_final_sprint)
     */
    _triggerDhafirHingeGunshotBreach() {
      if (this.game.isDisposed) return;

      // 1. Putar SFX tembakan baja berperedam: assets/audio/sfx_silenced_gunshots.mp3
      this.game.playOneShotSfx('assets/audio/sfx_silenced_gunshots.mp3');

      // 2. Guncangan kamera & nyalakan percikan api + kepulan asap pada engsel pintu
      this.game.cameraShakeDuration = 1.15;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.095;

      if (this.archiveHingeSparksMat) {
        this.archiveHingeSparksMat.opacity = 1.0;
      }
      if (this.archiveHingeSmokeGroup) {
        this.archiveHingeSmokeGroup.visible = true;
      }
      if (this.archiveBreachFlashLight) {
        this.archiveBreachFlashLight.intensity = 4.2;
      }

      // 3. Setelah tembakan mengenai engsel (550ms), putar sfx_door_kick_open.mp3 & tumbangkan pintu!
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;

        this.game.playOneShotSfx('assets/audio/sfx_door_kick_open.mp3');
        this.game.cameraShakeDuration = 0.75;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.11;

        // Buka kunci & hilangkan penghalang collider pintu
        this.isArchiveExitBreached = true;
        this.isPlayerTrappedInArchive = false;
        this.isMainLobbyUnlocked = true;
        this.isArchiveBreachAnimating = true;
        this.archiveBreachAnimStart = performance.now();

        if (this.archiveDoorMesh) {
          this.archiveDoorMesh.isLocked = false;
        }
        if (this.archiveExitDoorMesh) {
          this.archiveExitDoorMesh.isLocked = false;
        }
        if (this.floor1LobbyEntity) {
          this.floor1LobbyEntity.visible = true;
        }

        // Lanjutkan dialog Babak 7 (maya_cough_smoke -> dhafir_final_push -> maya_final_sprint)
        this._runPanicArchivePostBreachChain(0);
      }, 550);
    }

    _runPanicArchivePostBreachChain(index) {
      if (this.game.isDisposed) return;

      if (index >= PANIC_ARCHIVE_POST_BREACH_SEQUENCE.length) {
        // Begitu sekuens pintu arsip hancur (Babak 7) tuntas:
        // Langsung picu runtuhnya pilar utama lobi & instruksi Dhafir untuk belok kanan ke Security Hub!
        this._triggerLobbyPillarCollapseAndAbort();
        return;
      }

      const item = PANIC_ARCHIVE_POST_BREACH_SEQUENCE[index];

      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runPanicArchivePostBreachChain(index + 1);
      }, item.duration);
    }


    /**
     * 1. Transisi Lorong, Rute Terpotong, & Masuk ke Security Hub:
     * Begitu sekuens pintu arsip hancur tuntas:
     * - Putar sfx_pillar_collapse.mp3 disertai guncangan kamera (camera shake).
     * - Dhafir memotong jalur via radio: dhafir_abort_lobby.mp3 (11000ms).
     * - Perbarui objektif HUD: "Belok kanan dan masuk ke Ruang Kontrol Keamanan!"
     */
    _triggerLobbyPillarCollapseAndAbort() {
      if (this.hasTriggeredLobbyPillarCollapse || this.game.isDisposed) return;
      this.hasTriggeredLobbyPillarCollapse = true;
      this.isLobbyPillarCollapsed = true;
      this.isLobbyPillarCollapsing = true;
      this.lobbyPillarCollapseStart = performance.now();
      this.isMainLobbyUnlocked = true;

      // Putar suara dentuman keras reruntuhan pilar di ujung lorong lobi
      this.game.playOneShotSfx('assets/audio/sfx_pillar_collapse.mp3');

      // Guncangan kamera hebat saat pilar utama lobi runtuh
      this.game.cameraShakeDuration = 1.45;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.125;

      // Perbarui objektif HUD sesuai spesifikasi
      this.lastCheckpoint = { x: 1.9, y: -2.52, z: 25.2, yaw: Math.PI };
      this.game.setObjective('Belok kanan dan masuk ke Ruang Kontrol Keamanan!');

      // Dhafir memotong jalur via radio (dhafir_abort_lobby.mp3 - 11000ms)
      this.isRadioTransmitting = true;
      this.isActionBusy = false; // Izinkan pemain menekan [E] pada pintu Security Hub saat tiba
      this.game.setRadioTransmitting(true);
      this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      this.game.showSubtitle(
        'TRANSMISI RADIO // DHAFIR [CH-04]',
        "Dhafir: 'Batal! Maya, berhenti! Makhluk itu menjatuhkan pilar di depan lobi, jalurnya tertutup! Belok kanan lima meter, masuk ke Ruang Kontrol Keamanan dan kunci gerendel manualnya dari dalam!'",
        false
      );

      this.game._playAudioWithFallback('assets/audio/dhafir_abort_lobby.mp3', 11000, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        if (!this.isSecurityHubDoorLocked) {
          this.isRadioTransmitting = false;
          this.game.setRadioTransmitting(false);
          this.game.hideSubtitle();
        }
      }, 11000);
    }

    /**
     * Pemain masuk ke dalam Ruang Kontrol Keamanan (Security Hub) dan menekan [E] pada pintu:
     * - Putar SFX gerendel besi: assets/audio/sfx_heavy_bolt_lock.mp3
     * - Kunci status pintu (securityHubDoor.isLocked = true) dan tutup collidernya
     * - Maya merespons via radio: assets/audio/maya_enter_safe_room.mp3 (9000ms)
     * - Lanjutkan ke Rangkaian Dialog Sinkron Fase 2, 3, dan 4 Tim "Code 0"
     */
    /**
     * 2. Perbaikan Animasi & Fisika Pintu Ruang Kontrol (Security Hub Door):
     * - Begitu pemain melangkah melewati ambang pintu (atau menekan [E]), daun pintu berayun menutup secara mulus
     *   menggunakan interpolasi Lerp/Tween rotasi Y dari -90 derajat (-Math.PI/2) ke 0 derajat selama 0.8 detik (800ms).
     * - Putar SFX pintu terbanting rapat: assets/audio/sfx_door_slam_lock.mp3 (dan sfx_heavy_bolt_lock.mp3).
     * - Aktifkan collider solid daun pintu dan kunci statusnya (securityHubDoor.isLocked = true).
     * - Simpan checkpoint ke CP_FLOOR_1_SECURITY_HUB.
     */
    _lockSecurityHubDoorAndStartCode0() {
      if (this.hasPlayerEnteredSecurityHub || this.isSecurityHubDoorLocked || this.game.isDisposed) return;
      this.hasPlayerEnteredSecurityHub = true;

      if (this.game.camera && this.game.camera.position.x > -3.05) {
        this.game.camera.position.x = -3.35;
        this.game.camera.position.z = 26.85;
      }

      if (this.checkpointManager) {
        this.checkpointManager.setCheckpoint('CP_FLOOR_1_SECURITY_HUB');
      }

      this.isSecurityHubDoorLocked = true;
      this.isSecurityHubDoorClosing = true;
      this.securityHubDoorFromAngle = this.securityHubDoorPivot ? this.securityHubDoorPivot.rotation.y : -Math.PI / 2;
      this.securityHubDoorToAngle = 0.0;
      this.securityHubDoorAnimDuration = 800;
      this.securityHubDoorAnimStart = performance.now();

      if (this.securityHubDoor) {
        this.securityHubDoor.isLocked = true;
      }

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
        this.activeMonologueTimer = null;
      }

      this.game.playOneShotSfx('assets/audio/sfx_door_slam_lock.mp3');
      this.game.playOneShotSfx('assets/audio/sfx_heavy_bolt_lock.mp3');

      this.game.cameraShakeDuration = 0.55;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.072;

      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      this.code0ShadowActive = true;

      this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      this.game.showSubtitle(
        'TRANSMISI RADIO // MAYA [SECURITY HUB]',
        "Maya: 'Aku sudah di dalam! Gerendel bajanya sudah terkunci rapat! Dhafir, dinding di luar bergetar hebat... dentumannya tepat di balik tembok ini!'",
        false
      );
      this.game.setObjective('Bertahan di dalam Ruang Kontrol Keamanan — Dengarkan transmisi radio.');

      this.game._playAudioWithFallback('assets/audio/maya_enter_safe_room.mp3', 9000, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runCode0SecurityHubCommsChain(0);
      }, 9000);
    }

    /**
     * 3. Rangkaian Dialog Sinkron & Terstruktur (Chained Comms Sequence - Fase 2, 3, dan 4):
     * Menjalankan seluruh 16 transmisi secara berurutan sesuai durasi presisi milidetik.
     * Setiap transmisi masuk membunyikan klik radio assets/audio/sfx_radio_click_chime.mp3.
     */
    _runCode0SecurityHubCommsChain(index) {
      if (this.game.isDisposed) return;

      if (index >= CODE0_SECURITY_HUB_SEQUENCE.length) {
        // 4. Pemicu Aksi Interaktif Pemain tepat setelah dhafir_final_breach_call.mp3 (6000ms) selesai:
        // - Reset flag isRadioTransmitting = false (dan isMayaSpeaking = false)
        this.isRadioTransmitting = false;
        this.isActionBusy = false;
        this.game.setRadioTransmitting(false);
        this.game.hideSubtitle();

        // - Aktifkan Tuas Pemutus Daya Sektor 2 dengan prompt "[E] Tarik Tuas Pemutus Daya Sektor 2"
        this.isBreachCountdownFinished = true;
        this.isSector2LeverReady = true;
        if (this.sector2BreakerLEDMat) {
          this.sector2BreakerLEDMat.color.setHex(0x22c55e);
        }
        if (this.sector2BreakerGlowLight) {
          this.sector2BreakerGlowLight.color.setHex(0x22c55e);
          this.sector2BreakerGlowLight.intensity = 1.65;
        }

        // - Perbarui objektif HUD sesuai spesifikasi
        this.game.setObjective('SEKARANG: Tekan [E] untuk mematikan lampu Sektor 2 dan memicu serbuan Code 0!');
        return;
      }

      const item = CODE0_SECURITY_HUB_SEQUENCE[index];

      // Pastikan flag penguncian interaksi ponsel aktif ketat selama percakapan berlangsung
      this.isRadioTransmitting = true;
      this.isActionBusy = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.objectiveOnStart) {
        this.game.setObjective(item.objectiveOnStart);
      }

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      if (item.shadowBurst) {
        this.code0MuzzleFlashTimer = 0.85;
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;

        // Begitu dialog maya_acknowledge_cctv.mp3 tuntas, nyalakan layar monitor CCTV Kamera 4 (Lantai 2 Atrium)!
        if (item.activateCctvAfter) {
          this._activateCctvCamera4MarkFeed();
        }

        this._runCode0SecurityHubCommsChain(index + 1);
      }, item.duration);
    }

    /**
     * Mengaktifkan Layar Monitor CCTV Tabung (Kamera 4 - Lantai 2 Atrium) & Menampilkan Model 3D Dr. Mark Evans
     * yang tergantung lemas terlilit kabel dan tentakel biomekanik gelap di tiang struktur.
     */
    _activateCctvCamera4MarkFeed() {
      this.isCctvCam4Active = true;
      if (this.cctvCam4ScreenMat) {
        this.cctvCam4ScreenMat.color.setHex(0xffffff);
      }
      if (this.cctvCam4GlowLight) {
        this.cctvCam4GlowLight.intensity = 1.35;
      }
      if (this.markHostage3DGroup) {
        this.markHostage3DGroup.visible = true;
      }
      this._updateCctvCamera4Canvas(0);
    }

    /**
     * Merender visual hitam-putih grainy Kamera 4 (Lantai 2 Atrium) pada permukaan tabung monitor CRT
     */
    _updateCctvCamera4Canvas(elapsed) {
      if (!this.cctvCam4Ctx || !this.cctvCam4Texture) return;
      const ctx = this.cctvCam4Ctx;
      const w = 512;
      const h = 384;

      // Latar belakang hitam-putih kontras tinggi Kamera 4 (Lantai 2 Atrium)
      ctx.fillStyle = this.hasPulledSector2Lever ? '#05070b' : '#141820';
      ctx.fillRect(0, 0, w, h);

      // Siluet Pilar Struktur Lantai 2 Atrium di tengah layar CCTV
      ctx.fillStyle = this.hasPulledSector2Lever ? '#0f141c' : '#2d3440';
      ctx.fillRect(216, 28, 80, 328);

      // Siluet Dr. Mark Evans tergantung lemas di pilar struktur
      const pulse = Math.sin(elapsed * 4.2) * 3;
      ctx.fillStyle = this.hasPulledSector2Lever ? '#64748b' : '#cbd5e1';
      ctx.beginPath();
      ctx.arc(256, 128 + pulse * 0.3, 20, 0, Math.PI * 2); // kepala tertunduk
      ctx.fill();
      ctx.fillRect(230, 150, 52, 92); // jas lab Dr. Mark Evans

      // Drive dekripsi berkedip di saku jas kiri Mark
      ctx.fillStyle = (Math.floor(elapsed * 6) % 2 === 0) ? '#f8fafc' : '#64748b';
      ctx.fillRect(264, 178, 10, 16);

      // Sulur / Tentakel Biomekanik Gelap yang melilit tubuh & tengkuk Mark
      ctx.strokeStyle = '#040608';
      ctx.lineWidth = 8;
      for (let i = 0; i < 5; i++) {
        if (this.hasPulledSector2Lever && i === 2) continue; // Tentakel tangan kanan putus ditembak Jack!
        ctx.beginPath();
        ctx.moveTo(175, 118 + i * 28);
        ctx.quadraticCurveTo(256, 126 + i * 28 + Math.sin(elapsed * 5 + i) * 6, 338, 114 + i * 28);
        ctx.stroke();
      }

      // Garis scanline & butiran grain hitam-putih khas monitor tabung CCTV
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      for (let y = 0; y < h; y += 6) {
        ctx.fillRect(0, (y + Math.floor(elapsed * 40)) % h, w, 2);
      }
      for (let g = 0; g < 65; g++) {
        const gx = (Math.sin(g * 78.233 + elapsed * 31) * 0.5 + 0.5) * w;
        const gy = (Math.cos(g * 45.164 + elapsed * 27) * 0.5 + 0.5) * h;
        ctx.fillStyle = (g % 2 === 0) ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.32)';
        ctx.fillRect(gx, gy, 4, 3);
      }

      // Overlay Header & Timestamp Kamera Pengawas
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('CAM 04 // LANTAI 2 ATRIUM [SEKTOR 2]', 22, 34);
      ctx.fillText(
        this.hasPulledSector2Lever
          ? 'STATUS: SEKTOR 2 BLACKOUT — SERBUAN CODE 0 AKTIF!'
          : 'SUBJEK TERDETEKSI: DR. MARK EVANS [TERLILIT INANG SARAF]',
        22,
        358
      );

      this.cctvCam4Texture.needsUpdate = true;
    }

    /**
     * 4. Pemicu Aksi Interaktif Pemain pada Tuas Pemutus Daya Sektor 2:
     * Saat pemain menekan [E] pada panel konsol pemutus daya Sektor 2:
     * - Animasi tuas pemutus daya ditarik turun
     * - Mematikan lampu Sektor 2 & memicu serbuan kilatan senjata Tim Code 0 dari bayangan untuk membebaskan Mark
     */
    /**
     * 4. Rantai Dialog Serbuan Pemadaman Listrik (Chained Rapid Sequence):
     * Begitu pemain menekan [E] pada tuas pemutus daya di Security Hub:
     * - Lampu Sektor 2 dan atrium padam total.
     * - Aktifkan lampu darurat merah berputar (red strobe light) dan efek partikel percikan api di konsol.
     * - Jalankan rantai transmisi radio 11 bagian bertempo tinggi secara sinkron dengan klik radio sfx_radio_click_chime.mp3.
     */
    _pullSector2BreakerLever() {
      if (this.hasPulledSector2Lever || this.game.isDisposed) return;

      if (!this.isBreachCountdownFinished && !this.isSector2LeverReady) {
        this.game._playProceduralClickSfx(140);
        this.game.showHUDWarning('Tunggu aba-aba Dhafir lewat radio!');
        return;
      }

      this.hasPulledSector2Lever = true;
      this.isSector2LeverAnimating = true;
      this.sector2LeverAnimStart = performance.now();
      this.isSector2BlackoutActive = true;

      if (this.securityHubMainLight) {
        this.securityHubMainLight.intensity = 0.08;
        this.securityHubMainLight.color.setHex(0xef4444);
      }
      if (this.securityHubRedStrobeLight) {
        this.securityHubRedStrobeLight.intensity = 2.85;
      }
      if (this.securityHubStrobeBeamMat) {
        this.securityHubStrobeBeamMat.emissiveIntensity = 1.0;
      }
      if (this.consoleBreakerSparksMat) {
        this.consoleBreakerSparksMat.opacity = 1.0;
      }

      if (this.sector2BreakerLEDMat) {
        this.sector2BreakerLEDMat.color.setHex(0xef4444);
      }
      if (this.sector2BreakerGlowLight) {
        this.sector2BreakerGlowLight.color.setHex(0xef4444);
        this.sector2BreakerGlowLight.intensity = 0.65;
      }

      this.game.playOneShotSfx('assets/audio/sfx_heavy_bolt_lock.mp3');
      this.game.cameraShakeDuration = 0.65;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.075;

      this._updateCctvCamera4Canvas(performance.now() * 0.001);

      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this._runSector2BlackoutAssaultChain(0);
    }

    /**
     * Menjalankan 11 klip dialog serbuan cepat (maya_cut_power -> ... -> dhafir_final_route)
     * dengan durasi milidetik presisi (4000ms / 5000ms) & sfx_heavy_automatic_fire.mp3.
     */
    _runSector2BlackoutAssaultChain(index) {
      if (this.game.isDisposed) return;

      if (index >= SECTOR2_BLACKOUT_ASSAULT_SEQUENCE.length) {
        // 5. Transisi Pasca-Dialog & Objektif Baru setelah dhafir_final_route.mp3 (5000ms) tuntas:
        this.isRadioTransmitting = false;
        this.isActionBusy = false;
        this.game.setRadioTransmitting(false);
        this.game.hideSubtitle();

        // - Simpan checkpoint ke CP_FLOOR_1_CARGO_HALL
        if (this.checkpointManager) {
          this.checkpointManager.setCheckpoint('CP_FLOOR_1_CARGO_HALL');
        }

        // - Buka interaksi [E] pada pintu Security Hub & ayunkan pintu membuka ke arah luar
        this.canUnlockSecurityHubDoorToExit = true;
        this._openSecurityHubDoorToCargoHall();

        // - Perbarui objektif HUD sesuai spesifikasi
        this.game.setObjective('Susuri koridor kargo dan ruang genset menuju Konsol Gerbang Utama!');

        // - Aktifkan AI monster di koridor sayap barat dengan Fatal Gaze & kedip mata [Spacebar]
        this.isWestWingMonsterActive = true;
        if (this.westWingCargoEntity) {
          this.westWingCargoEntity.visible = true;
        }
        return;
      }

      const item = SECTOR2_BLACKOUT_ASSAULT_SEQUENCE[index];

      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);

      if (item.playChime) {
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      }

      if (item.playHeavyFireOnStart) {
        this.game.playOneShotSfx('assets/audio/sfx_heavy_automatic_fire.mp3');
        this.code0MuzzleFlashTimer = 3.6;
        this.game.cameraShakeDuration = 1.1;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.092;
      }

      if (item.dropMarkOnStart) {
        this.isMarkDroppedFromPillar = true;
        if (this.markRightArmTendrilMesh) {
          this.markRightArmTendrilMesh.visible = false;
        }
        this.markHostageTendrils.forEach((t) => {
          t.visible = false;
        });
        if (this.markHostage3DGroup) {
          this.markHostage3DGroup.position.y = -3.05;
        }
      }

      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;

        if (item.playHeavyFireAfter) {
          this.game.playOneShotSfx('assets/audio/sfx_heavy_automatic_fire.mp3');
          this.code0MuzzleFlashTimer = 2.5;
        }

        this._runSector2BlackoutAssaultChain(index + 1);
      }, item.duration);
    }

    /**
     * Membuka gerendel manual & memutar animasi pintu Security Hub berayun membuka ke arah luar (+90 derajat)
     * menuju Koridor Kargo & Ruang Genset Lantai 1.
     */
    _openSecurityHubDoorToCargoHall() {
      if (this.isSecurityHubExitDoorOpen || this.game.isDisposed) return;
      this.isSecurityHubExitDoorOpen = true;
      this.isSecurityHubDoorLocked = false;
      this.isSecurityHubDoorClosing = true;
      this.securityHubDoorFromAngle = this.securityHubDoorPivot ? this.securityHubDoorPivot.rotation.y : 0.0;
      this.securityHubDoorToAngle = Math.PI / 2;
      this.securityHubDoorAnimDuration = 800;
      this.securityHubDoorAnimStart = performance.now();

      if (this.securityHubDoor) {
        this.securityHubDoor.isLocked = false;
      }

      this.game.playOneShotSfx('assets/audio/sfx_heavy_bolt_lock.mp3');
    }

    /**
     * 1. Pembukaan Gerbang Utama & Pementasan Mobil Evakuasi:
     * - Pintu gerbang lapis baja bergeser membuka ke atas perlahan disertai SFX hidrolik berat: sfx_blast_door_open.mp3.
     * - Di luar gerbang terlihat latar berkabut dengan kendaraan lapis baja hitam bermesin menderu (sfx_engine_idle_loop.mp3).
     * - Dhafir berdiri di ambang pintu belakang mobil bertopeng balistik hitam penuh, memberi isyarat tangan.
     * - Putar audio Dhafir: assets/audio/dhafir_get_in_van.mp3 (5000ms).
     * - Perbarui objektif HUD: "Lari dan naik ke dalam kendaraan taktis!"
     */
    _triggerMainLobbyDawnEscape() {
      if (this.isBlastDoorOpening || this.isBlastDoorOpen || this.game.isDisposed) return;
      this.isBlastDoorOpening = true;
      this.isBlastDoorOpen = true;
      this.blastDoorAnimStart = performance.now();
      this.isWaitingToBoardApc = true;

      // Matikan monster sayap barat saat gerbang utama mulai terbuka
      this.isWestWingMonsterActive = false;
      if (this.westWingCargoEntity) {
        this.westWingCargoEntity.visible = false;
      }

      // 1. Putar SFX hidrolik berat pembukaan gerbang lapis baja: assets/audio/sfx_blast_door_open.mp3
      this.game.playOneShotSfx('assets/audio/sfx_blast_door_open.mp3');

      // 2. Putar suara deru mesin kendaraan taktis APC: assets/audio/sfx_engine_idle_loop.mp3
      try {
        const eng = new Audio('assets/audio/sfx_engine_idle_loop.mp3');
        eng.loop = true;
        eng.volume = Math.min(1, this.game._getEffectiveVolume() * 0.75);
        const p = eng.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.apcEngineAudio = eng;
      } catch (_) {}

      this.game.cameraShakeDuration = 1.4;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.055;

      // 3. Perbarui objektif HUD sesuai spesifikasi
      this.game.setObjective('Lari dan naik ke dalam kendaraan taktis!');

      // 4. Putar audio Dhafir: assets/audio/dhafir_get_in_van.mp3 (Durasi: 5000ms)
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(
        'DHAFIR [CODE 0 - LEAD]',
        "Dhafir: 'Maya, naik ke mobil sekarang! Warga sipil sudah aman di dalam!'",
        false
      );
      this.game._playAudioWithFallback('assets/audio/dhafir_get_in_van.mp3', 5000, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        if (!this.hasBoardedApc) {
          this.isRadioTransmitting = false;
          this.game.setRadioTransmitting(false);
          this.game.hideSubtitle();
        }
      }, 5000);
    }

    /**
     * 2. Interior Kabin Kendaraan & Keragaman Model Warga:
     * - Kunci posisi kamera di bangku penumpang kabin belakang menghadap para warga selamat & kaca belakang.
     * - Pintu belakang kendaraan tertutup keras: putar assets/audio/sfx_van_door_slam.mp3.
     * - Maya merespons lega: assets/audio/maya_safe_inside.mp3 (5000ms).
     */
    _enterTacticalApcCabinSequence() {
      if (this.hasBoardedApc || this.game.isDisposed) return;
      this.hasBoardedApc = true;
      this.isWaitingToBoardApc = false;
      this.isInApcCabin = true;

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
        this.activeMonologueTimer = null;
      }

      // Kunci interaksi & sembunyikan prompt selama sekuens sinematik berlangsung
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      if (this.game.isPhoneOpen) {
        this.game.toggleSmartphone(false);
      }

      // Reset input gerak jalan & tempatkan kamera pemain duduk di bangku kabin belakang menghadap warga & kaca belakang
      if (this.game.moveInput) {
        this.game.moveInput.forward = false;
        this.game.moveInput.backward = false;
        this.game.moveInput.left = false;
        this.game.moveInput.right = false;
      }
      if (this.game.camera) {
        this.game.camera.position.set(-3.2, -2.85, 68.55);
        this.game.yaw = 0.0; // Menghadap ke -z (para warga di kiri-kanan & kaca belakang mobil)
        this.game.pitch = -0.06;
        this.game.camera.rotation.set(this.game.pitch, this.game.yaw, 0, 'YXZ');
      }

      // Pindahkan Dhafir dari ambang pintu ke kursi komando kabin depan
      if (this.dhafirApcMesh) {
        this.dhafirApcMesh.position.set(0.55, 0.42, 1.95);
        this.dhafirApcMesh.rotation.y = 0;
      }

      // Animasi pintu belakang kendaraan tertutup keras & putar sfx_van_door_slam.mp3
      this.isApcRearDoorClosing = true;
      this.apcRearDoorAnimStart = performance.now();
      this.game.playOneShotSfx('assets/audio/sfx_van_door_slam.mp3');

      this.game.cameraShakeDuration = 0.45;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.07;

      // Maya merespons lega: assets/audio/maya_safe_inside.mp3 (Durasi: 5000ms)
      this.game.showSubtitle(
        'MAYA [DI DALAM KABIN APC]',
        "Maya: 'Pintu tertutup! Kita semua sudah di dalam... kita berhasil keluar hidup-hidup!'",
        false
      );
      this.game.setObjective('Di dalam Kendaraan Taktis Code 0 — Evakuasi meninggalkan kompleks fasilitas.');
      this.game._playAudioWithFallback('assets/audio/maya_safe_inside.mp3', 5000, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._startApcDriveAndCityDetonationSequence();
      }, 5000);
    }

    /**
     * 3. Sekuens Mobil Melaju & Peledakan Kota (The Incineration):
     * - Mobil berakselerasi kencang: sfx_van_acceleration.mp3 + vehicle rumble shake.
     * - Dhafir mengangkat radio pemantik: dhafir_order_detonation.mp3 (8000ms).
     * - Jack menekan tombol pemicu detonator: jack_detonate_confirm.mp3 (9000ms).
     * - Ledakan Kota: sfx_city_destruction_blast.mp3 + kilatan oranye-putih masif + sfx_tinnitus_ringing.mp3 + fade to black 2.5s.
     */
    _startApcDriveAndCityDetonationSequence() {
      if (this.game.isDisposed) return;
      this.isApcDriving = true;
      this.apcDriveTimer = 0;

      // Putar audio akselerasi kendaraan taktis: assets/audio/sfx_van_acceleration.mp3
      this.game.playOneShotSfx('assets/audio/sfx_van_acceleration.mp3');

      // 1. Dhafir memberi perintah peledakan kota: dhafir_order_detonation.mp3 (Durasi: 8000ms)
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
      this.game.showSubtitle(
        'DHAFIR [CODE 0 - COMMAND]',
        "Dhafir: 'Jarak aman tercapai. Jack... bakar seluruh kota. Jangan sisakan satu sel pun dari monster itu.'",
        false
      );
      this.game._playAudioWithFallback('assets/audio/dhafir_order_detonation.mp3', 8000, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;

        // 2. Jack mengonfirmasi & menekan pemicu detonator: jack_detonate_confirm.mp3 (Durasi: 9000ms)
        this.game.playOneShotSfx('assets/audio/sfx_radio_click_chime.mp3');
        this.game.showSubtitle(
          'JACK [CODE 0 - DEMOLITION]',
          "Jack: 'Dengan senang hati, komandan. Ledakan termobarik aktif dalam tiga... dua... satu... selamat tinggal neraka!'",
          false
        );
        this.game._playAudioWithFallback('assets/audio/jack_detonate_confirm.mp3', 9000, null);

        this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
          if (this.game.isDisposed) return;
          this.activeMonologueTimer = null;
          this._triggerCityThermobaricBlast();
        }, 9000);
      }, 8000);
    }

    _ensureIncinerationOverlayDOM() {
      if (this.incinerationOverlayEl) return this.incinerationOverlayEl;
      let el = document.getElementById('incineration-transition-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'incineration-transition-overlay';
        el.style.cssText = [
          'position:fixed',
          'inset:0',
          'z-index:88',
          'pointer-events:none',
          'opacity:0',
          'background:#fff7ed',
          'transition:opacity 0.25s ease, background 1.2s ease'
        ].join(';');
        const parent = document.getElementById('game-viewport-container') || document.body;
        parent.appendChild(el);
      }
      this.incinerationOverlayEl = el;
      return el;
    }

    /**
     * Eksekusi Ledakan Termobarik Kota, Kilatan Oranye-Putih Kaca Belakang, Tinnitus, & Fade-to-Black (2.5s)
     */
    _triggerCityThermobaricBlast() {
      if (this.game.isDisposed) return;

      // 1. Putar dentuman dahsyat ledakan kota: assets/audio/sfx_city_destruction_blast.mp3
      this.game.playOneShotSfx('assets/audio/sfx_city_destruction_blast.mp3');

      // 2. Nyalakan kilatan cahaya oranye-putih masif dari jendela kaca belakang mobil & guncangan kamera hebat
      if (this.apcRearWindowMat) {
        this.apcRearWindowMat.color.setHex(0xffedd5);
        this.apcRearWindowMat.opacity = 1.0;
      }
      if (this.apcBlastFlashLight) {
        this.apcBlastFlashLight.color.setHex(0xffaa33);
        this.apcBlastFlashLight.intensity = 14.0;
      }

      this.game.cameraShakeDuration = 2.5;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.16;

      const overlay = this._ensureIncinerationOverlayDOM();
      if (overlay) {
        overlay.style.transition = 'opacity 0.18s ease';
        overlay.style.background = 'radial-gradient(circle, #ffffff 25%, #fb923c 75%, #ea580c 100%)';
        overlay.style.opacity = '0.96';
      }

      // 3. Fade out audio mesin lingkungan & ganti dengan SFX denging telinga (tinnitus): sfx_tinnitus_ringing.mp3
      if (this.apcEngineAudio) {
        try {
          this.apcEngineAudio.pause();
          this.apcEngineAudio.src = '';
        } catch (_) {}
        this.apcEngineAudio = null;
      }
      this.game.playOneShotSfx('assets/audio/sfx_tinnitus_ringing.mp3');
      this.game.hideSubtitle();

      // 4. Viewport layar perlahan memudar gelap total (fade to black selama 2.5 detik / 2500ms) seiring Maya pingsan
      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        if (overlay) {
          overlay.style.transition = 'background 1.8s ease, opacity 2.5s ease';
          overlay.style.background = '#000000';
          overlay.style.opacity = '1';
        }
      }, 350);

      // Setelah fade to black 2.5 detik selesai, tahan jeda layar gelap selama 2.0 detik (total 4500ms) lalu masuk ke Kamar Rumah Sakit!
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._startHospitalAwakeningScene();
      }, 4500);
    }

    /**
     * 4. Transisi Kamar Rumah Sakit (The Hospital Awakening - Belum Ending):
     * - Loop suara bip monitor detak jantung: assets/audio/sfx_hospital_heartbeat.mp3.
     * - Transisi visual mata terbuka (fade-in dengan filter blur/dof yang perlahan menjernih).
     * - Kamera berada pada posisi First-Person POV berbaring di atas ranjang medis (rotasi mouse dibatasi ±60 derajat).
     * - Di kursi sebelah kanan ranjang, duduk model 3D Dr. Mark Evans mengenakan kemeja rapi dengan perban di lehernya.
     * - Mark berbicara: assets/audio/mark_hospital_wake.mp3 (6000ms).
     * - Begitu dialog selesai: TAHAN ADEGAN di ruangan ini (JANGAN menampilkan layar tamat/credits).
     */
    _startHospitalAwakeningScene() {
      if (this.game.isDisposed) return;

      this.isApcDriving = false;
      this.isInApcCabin = false;
      this.isInHospitalBed = true;

      // Sembunyikan geometri fasilitas lama & tampilkan Kamar Rawat Rumah Sakit yang terang dan steril
      if (this.floorTwoGroup) {
        this.floorTwoGroup.visible = false;
      }
      if (this.hospitalRoomGroup) {
        this.hospitalRoomGroup.visible = true;
      }
      if (this.game.scene && this.game.scene.background) {
        this.game.scene.background.setHex(0xe0f2fe);
      }
      if (this.game.scene && this.game.scene.fog) {
        this.game.scene.fog.color.setHex(0xe0f2fe);
        this.game.scene.fog.near = 12;
        this.game.scene.fog.far = 45;
      }
      if (this.game.flashlight) {
        this.game.flashlightOn = false;
        this.game.flashlight.visible = false;
      }

      // Posisikan kamera First-Person POV berbaring di atas ranjang medis menghadap Dr. Mark Evans di sisi kanan
      this.hospitalBaseYaw = -0.42;
      if (this.game.camera) {
        this.game.camera.position.set(0.0, 20.92, 0.38);
        this.game.yaw = this.hospitalBaseYaw;
        this.game.pitch = -0.05;
        this.game.camera.rotation.set(this.game.pitch, this.game.yaw, 0, 'YXZ');
      }

      // 1. Putar loop suara bip monitor detak jantung: assets/audio/sfx_hospital_heartbeat.mp3
      this.game.playOneShotSfx('assets/audio/sfx_hospital_heartbeat.mp3');
      try {
        const hb = new Audio('assets/audio/sfx_hospital_heartbeat.mp3');
        hb.loop = true;
        hb.volume = Math.min(1, this.game._getEffectiveVolume() * 0.72);
        const p = hb.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        this.hospitalHeartbeatAudio = hb;
      } catch (_) {}

      // 2. Transisi visual mata terbuka (fade-in dengan filter blur/dof yang perlahan menjernih)
      if (this.game.canvas) {
        this.game.canvas.style.transition = 'filter 2.6s ease-out';
        this.game.canvas.style.filter = 'blur(12px)';
        setTimeout(() => {
          if (this.game && this.game.canvas) {
            this.game.canvas.style.filter = 'blur(0px)';
          }
        }, 120);
      }

      const overlay = this._ensureIncinerationOverlayDOM();
      if (overlay) {
        overlay.style.transition = 'opacity 2.6s ease-in-out';
        overlay.style.opacity = '0';
      }

      this.game.setObjective('Kamar Rawat Rumah Sakit — Lihat ke sekeliling ranjangmu.');

      // 3. Dr. Mark Evans menatap Maya, tersenyum tipis, lalu menyapa: mark_hospital_wake.mp3 (Durasi: 6000ms)
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(
        'DR. MARK EVANS',
        "Mark: 'Selamat pagi, Maya. Tidurmu nyenyak sekali... setelah semua kekacauan semalam.'",
        false
      );
      this.game._playAudioWithFallback('assets/audio/mark_hospital_wake.mp3', 6000, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._startEpilogueMedicalWalkAndArchiveTour();
      }, 6000);
    }

    /**
     * Membuat tekstur fallback 512x512 berkualitas tinggi sekaligus memuat file PNG asli dari direktori root (./photo_*.png)
     */
    _loadOrBuildArchiveSlideTexture(pngPath) {
      const THREE = window.THREE;
      if (!THREE) return null;
      if (this.archiveSlideTextures && this.archiveSlideTextures[pngPath]) {
        return this.archiveSlideTextures[pngPath];
      }

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Render visual arsip 512x512 langsung ke canvas (sekaligus menggambar Image saat ./photo_*.png selesai dimuat)
      ctx.fillStyle = '#0b1528';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, 488, 488);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';

      if (pngPath.indexOf('photo_entity_blueprint') !== -1) {
        ctx.fillText('PROJECT BLINDSPOT // ENTITY BLUEPRINT', 28, 48);
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(256, 220, 72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(230, 205, 14, 14);
        ctx.fillRect(268, 205, 14, 14);
        ctx.fillStyle = '#bae6fd';
        ctx.fillText('VISUAL CORTEX BIOWEAPON [512x512 PNG]', 28, 460);
      } else if (pngPath.indexOf('photo_organization_apex') !== -1) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('SYNDICATE APEX // TOP SECRET DIRECTIVE', 28, 48);
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(256, 120);
        ctx.lineTo(148, 310);
        ctx.lineTo(364, 310);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillText('STAMP: TOP SECRET // TOTAL PURGE', 82, 390);
      } else if (pngPath.indexOf('photo_code0_team') !== -1) {
        ctx.fillStyle = '#34d399';
        ctx.fillText('SPECIAL TACTICAL UNIT // CODE 0', 28, 48);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('DHAFIR [ZERO-1] | INTAN | JACK | MIKE', 36, 260);
        ctx.fillText('FAST HELMET + QUAD NVG + BALACLAVA', 36, 455);
      } else if (pngPath.indexOf('photo_dhafir_dossier') !== -1) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('DOSSIER: OPERATIVE DHAFIR [ZERO-1]', 28, 48);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(48, 180, 416, 110);
        ctx.fillStyle = '#fecaca';
        ctx.fillText('STAMP: ROGUE AGENT // SAVED CIVILIANS', 58, 242);
      } else {
        ctx.fillStyle = '#93c5fd';
        ctx.fillText('ID CARD: DR. MARK EVANS // ARCHITECT', 28, 48);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('CHIEF NEURAL ARCHITECT — LEVEL 5', 42, 260);
      }

      const tex = new THREE.CanvasTexture(canvas);
      this.archiveSlideTextures[pngPath] = tex;

      // Muat juga file PNG 512x512 dari direktori root (sejajar index.html) jika dijalankan via HTTP server / GitHub Pages
      try {
        if (THREE.TextureLoader) {
          const loader = new THREE.TextureLoader();
          loader.load(
            pngPath,
            (loadedTex) => {
              this.archiveSlideTextures[pngPath] = loadedTex;
              if (this.currentArchiveSlidePng === pngPath && this.archiveProjectorMat) {
                this.archiveProjectorMat.map = loadedTex;
                this.archiveProjectorMat.needsUpdate = true;
              }
            },
            undefined,
            () => {}
          );
        }
      } catch (_) {}

      return tex;
    }

    _setProjectorSlide(pngPath, playClick = true) {
      this.currentArchiveSlidePng = pngPath;
      const tex = this._loadOrBuildArchiveSlideTexture(pngPath);
      if (this.archiveProjectorMat && tex) {
        this.archiveProjectorMat.map = tex;
        this.archiveProjectorMat.needsUpdate = true;
      }
      if (this.archiveSecondaryMarkCardMesh && this.archiveSecondaryMarkCardMesh.material) {
        const markTex = this._loadOrBuildArchiveSlideTexture('./photo_mark_evans.png');
        if (markTex) {
          this.archiveSecondaryMarkCardMesh.material.map = markTex;
          this.archiveSecondaryMarkCardMesh.material.needsUpdate = true;
        }
      }
      if (playClick) {
        this.game.playOneShotSfx('assets/audio/sfx_slide_projector_click.mp3');
      }
    }

    /**
     * 1. Transisi dari Ranjang Medis ke Berjalan Menyusuri Lorong Sayap Medis bersama Dr. Mark Evans:
     * - Putar mark_invite_walk.mp3 (8000ms).
     * - Buka kontrol First-Person Maya (WASD + Mouse Look 360 derajat bebas).
     * - Putar maya_confused_hospital.mp3 (6000ms).
     * - Mark memandu jalan di depan Maya menuju pintu geser ruang arsip (sfx_door_slide_open.mp3)
     *   dan memutar mark_explain_facility.mp3 (11000ms).
     */
    _startEpilogueMedicalWalkAndArchiveTour() {
      if (this.game.isDisposed) return;

      // Preload ke-5 tekstur PNG 512x512 di papan arsip
      [
        './photo_entity_blueprint.png',
        './photo_organization_apex.png',
        './photo_code0_team.png',
        './photo_dhafir_dossier.png',
        './photo_mark_evans.png'
      ].forEach((p) => this._loadOrBuildArchiveSlideTexture(p));
      this._setProjectorSlide('./photo_entity_blueprint.png', false);

      // 1. Mark mengajak Maya berdiri: assets/audio/mark_invite_walk.mp3 (Durasi: 8000ms)
      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(
        'DR. MARK EVANS',
        "Mark: 'Tubuhmu sudah pulih, Maya. Berdirilah... ada banyak hal yang harus kamu ketahui sebelum kamu melangkah keluar dari sini.'",
        false
      );
      this.game._playAudioWithFallback('assets/audio/mark_invite_walk.mp3', 8000, null);

      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;

        // 2. Kontrol First-Person Maya dibuka kembali (gerakan berjalan WASD, mouse look bebas)
        this.isInHospitalBed = false;
        this.isInEpilogueWalk = true;
        this.isMarkLeadingTour = true;

        if (this.game.camera) {
          this.game.camera.position.set(-0.45, 21.60, -0.35);
          this.game.yaw = 0.0; // Menghadap ke arah lorong medis (-z)
          this.game.pitch = 0.0;
          this.game.camera.rotation.set(0, 0, 0, 'YXZ');
        }
        if (this.hospitalMarkGroup) {
          this.hospitalMarkGroup.position.set(0.35, 0, -1.65);
          this.hospitalMarkGroup.rotation.y = 0; // Menghadap ke arah ruang arsip (-z) untuk memandu jalan
        }

        this.game.setObjective('Ikuti Dr. Mark Evans menyusuri lorong medis menuju Ruang Arsip Perbatasan.');

        // 3. Maya merespons sambil melangkah: assets/audio/maya_confused_hospital.mp3 (Durasi: 6000ms)
        this.game.showSubtitle(
          'MAYA',
          "Maya: 'Tempat apa ini, Mark? Ini bukan rumah sakit sipil... di mana kita sebenarnya?!'",
          false
        );
        this.game._playAudioWithFallback('assets/audio/maya_confused_hospital.mp3', 6000, null);

        this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
          if (this.game.isDisposed) return;

          // 4. Pintu geser otomatis ruang arsip membuka disertai SFX: assets/audio/sfx_door_slide_open.mp3
          this.isMedicalSlidingDoorOpen = true;
          this.isMedicalSlidingDoorAnimating = true;
          this.medicalSlidingDoorAnimStart = performance.now();
          this.game.playOneShotSfx('assets/audio/sfx_door_slide_open.mp3');

          // Putar penjelasan Mark: assets/audio/mark_explain_facility.mp3 (Durasi: 11000ms)
          this.game.showSubtitle(
            'DR. MARK EVANS',
            "Mark: 'Ini pos pengawasan perbatasan. Kota kita sudah rata dengan tanah, tapi datanya... semua kebenaran tentang malam mengerikan itu tersimpan di ruangan ini.'",
            false
          );
          this.game._playAudioWithFallback('assets/audio/mark_explain_facility.mp3', 11000, null);

          this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
            if (this.game.isDisposed) return;
            this.activeMonologueTimer = null;
            this._startArchiveProjectorConspiracySequence();
          }, 11000);
        }, 6000);
      }, 8000);
    }

    /**
     * 2 & 3. Papan Arsip Digital (5 Foto PNG 512x512) & Puncak Emosional Maya-Mark
     */
    _startArchiveProjectorConspiracySequence() {
      if (this.hasStartedArchiveProjectorSequence || this.game.isDisposed) return;
      this.hasStartedArchiveProjectorSequence = true;
      this.isMarkLeadingTour = false;

      // Hentikan bip monitor jantung rumah sakit agar fokus ke ruang arsip & BGM penutup
      if (this.hospitalHeartbeatAudio) {
        try {
          this.hospitalHeartbeatAudio.pause();
          this.hospitalHeartbeatAudio.src = '';
        } catch (_) {}
        this.hospitalHeartbeatAudio = null;
      }

      // Pastikan Mark berdiri di samping papan proyektor digital (x = 1.65, z = -21.8) menghadap Maya
      if (this.hospitalMarkGroup) {
        this.hospitalMarkGroup.position.set(1.65, 0, -21.8);
        this.hospitalMarkGroup.rotation.y = Math.PI * 0.85;
      }
      if (this.markLeftLegPivot) this.markLeftLegPivot.rotation.x = 0;
      if (this.markRightLegPivot) this.markRightLegPivot.rotation.x = 0;
      if (this.markLeftArmPivot) this.markLeftArmPivot.rotation.x = 0;
      if (this.markRightArmPivot) this.markRightArmPivot.rotation.x = -0.35;

      // Jika pemain masih di lorong medis (z > -16.5), posisikan di depan layar proyektor agar seluruh foto 512x512 terlihat jelas
      if (this.game.camera && this.game.camera.position.z > -16.5) {
        this.game.camera.position.set(0.0, 21.60, -19.2);
        this.game.yaw = 0.0;
        this.game.pitch = 0.02;
        this.game.camera.rotation.set(this.game.pitch, this.game.yaw, 0, 'YXZ');
      }

      this.game.setObjective('Perhatikan layar proyektor arsip konspirasi Project Blindspot & Syndicate Apex.');
      this._runEpilogueArchiveChain(0);
    }

    _runEpilogueArchiveChain(index) {
      if (this.game.isDisposed) return;

      if (index >= EPILOGUE_ARCHIVE_SEQUENCE.length) {
        this._triggerEndCreditsRoll();
        return;
      }

      const item = EPILOGUE_ARCHIVE_SEQUENCE[index];

      // Ganti slide foto 512x512 pada layar proyektor & bunyikan sfx_slide_projector_click.mp3 jika diminta
      if (item.slidePng) {
        this._setProjectorSlide(item.slidePng, Boolean(item.playProjectorClick));
      }

      // Mulai fade-in bgm_bittersweet_ending.mp3 secara perlahan di volume 0.25 pada Puncak Emosional
      if (item.startEndingBgmFadeIn) {
        this._startBittersweetEndingBgm(0.25);
      }

      // Pada monolog refleksi terakhir Maya: aktifkan slow dolly/pan menyorot radio HT kecil di tangan Maya & jendela fajar
      if (item.startFinalDollyPan) {
        this.isFinalReflectionDollyActive = true;
        this.finalDollyTimer = 0;
        if (this.mayaPocketRadioMesh) {
          this.mayaPocketRadioMesh.visible = true;
        }
        this.game.setObjective('Refleksi Terakhir Maya — Menatap fajar dari pangkalan perbatasan.');
      }

      this.isRadioTransmitting = true;
      this.game.setRadioTransmitting(true);
      this.game.showSubtitle(item.speaker, item.text, false);
      this.game._playAudioWithFallback(item.file, item.duration, null);

      if (this.activeMonologueTimer) {
        this.game.clearPauseAwareTimeout(this.activeMonologueTimer);
      }
      this.activeMonologueTimer = this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.activeMonologueTimer = null;
        this._runEpilogueArchiveChain(index + 1);
      }, item.duration);
    }

    _startBittersweetEndingBgm(targetVol = 0.25) {
      this.endingBgmTargetVol = targetVol;
      try {
        if (!this.endingBgmAudio) {
          const bgm = new Audio('assets/audio/bgm_bittersweet_ending.mp3');
          bgm.loop = true;
          bgm.volume = 0.02;
          const p = bgm.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
          this.endingBgmAudio = bgm;
        }
      } catch (_) {}
    }

    /**
     * 4. Transisi Penutup Sinematik (End Credits Roll) & Tombol Interaktif "[ MAIN LAGI ]":
     * - Volume bgm_bittersweet_ending.mp3 naik ke 0.7.
     * - Layar memudar perlahan ke hitam pekat (fade to black selama 3.0 detik / 3000ms).
     * - Tampilkan overlay penutup bertuliskan:
     *   * Judul: "BLINDSPOT"
     *   * Subtitle: "Terima kasih telah bermain."
     *   * Gulirkan teks kredit para karakter (Maya, Dhafir - Code 0, Dr. Mark Evans, Intan, Jack, Mike).
     *   * Sediakan tombol interaktif: "[ MAIN LAGI ]" untuk me-reset permainan dari checkpoint awal.
     */
    _triggerEndCreditsRoll() {
      if (this.hasTriggeredEndCredits || this.game.isDisposed) return;
      this.hasTriggeredEndCredits = true;
      this.isFinalReflectionDollyActive = false;
      this.isRadioTransmitting = false;
      this.game.setRadioTransmitting(false);
      this.game.hideSubtitle();

      // 1. Naikkan volume bgm_bittersweet_ending.mp3 ke 0.7
      this.endingBgmTargetVol = 0.7;
      if (this.endingBgmAudio) {
        try {
          this.endingBgmAudio.volume = 0.7;
        } catch (_) {}
      }

      // Lepaskan Pointer Lock agar pemain dapat mengklik tombol "[ MAIN LAGI ]"
      if (this.game && typeof this.game._unlockPointer === 'function') {
        this.game._unlockPointer();
      }

      // 2. Bangun & tampilkan overlay End Credits dengan fade-to-black 3.0 detik
      let creditsEl = document.getElementById('blindspot-end-credits-overlay');
      if (!creditsEl) {
        creditsEl = document.createElement('div');
        creditsEl.id = 'blindspot-end-credits-overlay';
        creditsEl.style.cssText = [
          'position:fixed',
          'inset:0',
          'z-index:95',
          'background:#000000',
          'color:#f8fafc',
          'display:flex',
          'flex-direction:column',
          'align-items:center',
          'justify-content:center',
          'text-align:center',
          'padding:2rem',
          'opacity:0',
          'pointer-events:auto',
          'transition:opacity 3.0s ease-in-out',
          'font-family:"Cinzel", serif'
        ].join(';');

        creditsEl.innerHTML = [
          '<div style="max-width:640px;width:100%;">',
          '  <h1 style="font-size:clamp(2.4rem,5vw,3.8rem);letter-spacing:0.32em;color:#f8fafc;text-shadow:0 0 24px rgba(239,68,68,0.65);margin-bottom:0.4rem;">BLINDSPOT</h1>',
          '  <p style="font-family:monospace;font-size:1.05rem;letter-spacing:0.22em;color:#93c5fd;margin-bottom:2.2rem;">Terima kasih telah bermain.</p>',
          '  <div style="border-top:1px solid rgba(148,163,184,0.25);border-bottom:1px solid rgba(148,163,184,0.25);padding:1.4rem 0;margin-bottom:2.2rem;font-family:monospace;font-size:0.88rem;line-height:2.0;letter-spacing:0.14em;color:#cbd5e1;">',
          '    <div style="color:#f87171;font-weight:bold;margin-bottom:0.4rem;">// DAFTAR KARAKTER &amp; KREDIT //</div>',
          '    <div><strong>MAYA</strong> &mdash; Penyintas Utama &amp; Subjek Uji Persepsi</div>',
          '    <div><strong>DHAFIR (CODE 0)</strong> &mdash; Komandan Taktis Bayangan [Zero-1]</div>',
          '    <div><strong>DR. MARK EVANS</strong> &mdash; Kepala Arsitek Saraf Project Blindspot</div>',
          '    <div><strong>INTAN (CODE 0)</strong> &mdash; Spesialis Infiltrasi Siber &amp; Frekuensi [Zero-2]</div>',
          '    <div><strong>JACK (CODE 0)</strong> &mdash; Spesialis Senjata Berat &amp; Demolisi [Zero-3]</div>',
          '    <div><strong>MIKE (CODE 0)</strong> &mdash; Spesialis Medis Tempur &amp; Biometrik [Zero-4]</div>',
          '  </div>',
          '  <button type="button" id="btn-play-again-epilogue" style="padding:0.85rem 2.4rem;background:rgba(153,27,27,0.75);border:1px solid #ef4444;color:#ffffff;font-family:monospace;font-size:0.95rem;letter-spacing:0.22em;cursor:pointer;text-transform:uppercase;box-shadow:0 0 20px rgba(239,68,68,0.45);">[ MAIN LAGI ]</button>',
          '</div>'
        ].join('\n');

        const parent = document.getElementById('game-viewport-container') || document.body;
        parent.appendChild(creditsEl);
      }

      this.endCreditsOverlayEl = creditsEl;
      requestAnimationFrame(() => {
        if (this.endCreditsOverlayEl) {
          this.endCreditsOverlayEl.style.opacity = '1';
        }
      });

      const playAgainBtn = document.getElementById('btn-play-again-epilogue');
      if (playAgainBtn) {
        playAgainBtn.onclick = (e) => {
          e.stopPropagation();
          this.resetGameFromInitialCheckpoint();
        };
      }
    }

    /**
     * Me-reset permainan kembali ke checkpoint awal (CP_FLOOR_3_BEDROOM) saat tombol "[ MAIN LAGI ]" ditekan
     */
    resetGameFromInitialCheckpoint() {
      if (this.endingBgmAudio) {
        try {
          this.endingBgmAudio.pause();
          this.endingBgmAudio.src = '';
        } catch (_) {}
        this.endingBgmAudio = null;
      }
      if (this.endCreditsOverlayEl) {
        this.endCreditsOverlayEl.style.opacity = '0';
        this.endCreditsOverlayEl.style.pointerEvents = 'none';
        if (this.endCreditsOverlayEl.parentNode) {
          this.endCreditsOverlayEl.parentNode.removeChild(this.endCreditsOverlayEl);
        }
        this.endCreditsOverlayEl = null;
      }
      if (this.incinerationOverlayEl) {
        this.incinerationOverlayEl.style.opacity = '0';
      }

      if (this.checkpointManager) {
        this.checkpointManager.setCheckpoint('CP_FLOOR_3_BEDROOM');
      }
      if (window.gameState) {
        window.gameState.currentCheckpoint = 'CP_FLOOR_3_BEDROOM';
      }

      // Inisialisasi ulang instance GameScene dari awal di Kamar Tidur Maya (CP_FLOOR_3_BEDROOM)
      if (this.game && this.game.canvas && typeof window.initGameScene === 'function') {
        const canvasEl = this.game.canvas;
        const settingsState = this.game.settings;
        window.initGameScene(canvasEl, settingsState);
      }
    }

    _triggerElectrocutionGameOver() {
      if (this.isFatalAttackInProgress || this.isCutsceneLocked) return;
      this.isFatalAttackInProgress = true;
      this.isCutsceneLocked = true;

      this.game.playOneShotSfx('assets/audio/sfx_elevator_spark.mp3');
      this.game.cameraShakeDuration = 0.85;
      this.game.cameraShakeTimer = 0;
      this.game.cameraShakeIntensity = 0.12;

      this._ensureFatalGazeOverlayDOM();
      if (this.fatalGazeOverlayEl) {
        const textEl = document.getElementById('fatal-gaze-text');
        this.fatalGazeOverlayEl.style.opacity = '1';
        this.fatalGazeOverlayEl.style.background =
          'radial-gradient(circle, rgba(56,189,248,0.85) 15%, rgba(15,23,42,0.96) 65%, #020617 100%)';
        this.fatalGazeOverlayEl.style.boxShadow = 'inset 0 0 160px #38bdf8';
        if (textEl) {
          textEl.innerHTML = 'TERSETRUM ARUS TINGGI<br><span style="font-size:0.95rem;letter-spacing:0.12em;color:#bae6fd;">JANGAN LEWATI AIR BERLISTRIK SEBELUM SEKRING DIMATIKAN!</span>';
          textEl.style.fontSize = '2.0rem';
          textEl.style.opacity = '1';
        }
      }

      this.game.setPauseAwareTimeout(() => {
        if (this.game.isDisposed) return;
        this.isFatalAttackInProgress = false;
        this.isCutsceneLocked = false;
        this.isActionBusy = false;
        if (this.game && typeof this.game.setMayaSpeaking === 'function') {
          this.game.setMayaSpeaking(false);
        }
        this._setFatalGazeOverlayState('none', 0);
        if (this.checkpointManager) {
          this.checkpointManager.setCheckpoint('CP_FLOOR_2_STAIRS');
          this.checkpointManager.respawnPlayer();
        }
      }, 2200);
    }

    /**
     * 4A. Membaca Memo Penghuni di Meja Rias Kamar 201
     */
    _inspectRoom201Memo() {
      this.hasReadRoom201Memo = true;
      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.game.showTemporarySubtitle(
        'MEMO PENGHUNI KAMAR 201',
        '"Jangan tertipu saat menunduk di lorong banjir! Mata merah makhluk itu memantul di permukaan air. Tembok ke Kamar 203 jebol—kotak sekring ada di sebelah sana."',
        5500
      );
    }

    /**
     * 4B. Mematikan Saklar Kotak Sekring di Kamar 203 (sfx_breaker_off.mp3) & Mencatat Digit Pertama "7"
     */
    _turnOffFloor2Breaker() {
      if (!this.isFloor2BreakerOn || this.isBreakerLeverAnimating) return;
      this.isBreakerLeverAnimating = true;
      this.breakerLeverAnimStart = performance.now();
      this.isFloor2BreakerOn = false;
      this.hasDigit7 = true;
      if (this.hasDigits42) {
        this.hasFullPadlockCode = true;
      }

      // Putar audio saklar sekring turun: assets/audio/sfx_breaker_off.mp3
      this.game.playOneShotSfx('assets/audio/sfx_breaker_off.mp3');
      this.game._setInteractionPrompt('');

      // Matikan visual percikan listrik di Koridor Timur
      if (this.electricSparkLight) {
        this.electricSparkLight.intensity = 0;
      }
      if (this.electricArcMat) {
        this.electricArcMat.opacity = 0;
      }

      this.lastCheckpoint = { x: 2.0, y: 1.68, z: -20.5, yaw: -Math.PI / 2 };

      this.game.showTemporarySubtitle(
        'MAYA',
        'Sekring listrik sudah kumatiin! Air di lorong timur aman sekarang... dan ada angka "7" tercakar di dinding samping sekring ini.',
        5200
      );
      this.game.setObjective(
        this.hasFullPadlockCode
          ? 'Kembali ke tangga darurat dan buka gembok kombinasi (7-4-2).'
          : 'Seberangi lorong yang kini aman dari listrik menuju Kamar 205 untuk mencari sisa kode gembok (7 - ? - ?).'
      );
    }

    _inspectWallDigit7() {
      this.hasDigit7 = true;
      if (this.hasDigits42) {
        this.hasFullPadlockCode = true;
      }
      this.game._playProceduralClickSfx(240);
      this.game.showTemporarySubtitle(
        'MAYA',
        'Angka "7" tercakar dalam di dinding samping kotak sekring. Ini pasti digit pertama gembok tangga darurat!',
        4200
      );
    }

    /**
     * 5B. Memeriksa Papan Memo Inventaris di Kamar 205 (Gudang Servis: Digit "4 - 2")
     */
    _inspectRoom205Memo() {
      this.hasDigits42 = true;
      this.hasDigit7 = true;
      this.hasFullPadlockCode = true;

      this.game.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
      this.lastCheckpoint = { x: 18.6, y: 1.68, z: -25.2, yaw: 0 };

      if (this.game.keyHudBadge) {
        this.game.keyHudBadge.textContent = 'KODE GEMBOK: 7 - 4 - 2';
        this.game.keyHudBadge.classList.add('active-badge');
      }

      this.game.showTemporarySubtitle(
        'MAYA',
        'Papan memo inventaris: "4 - 2"! Digabung dengan angka 7 di ruang sekring tadi... kodenya 7 - 4 - 2! Aku harus kembali ke pintu tangga darurat!',
        5500
      );
      this.game.setObjective('Kembali ke tangga darurat dan buka gembok kombinasi (7-4-2).');
    }

    _startOrUpdateStaticBuzz(intensityFactor) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        if (!this.game._sfxCtx) {
          this.game._sfxCtx = new AudioCtx();
        }
        const ctx = this.game._sfxCtx;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        if (!this.staticBuzzOsc) {
          this.staticBuzzOsc = ctx.createOscillator();
          this.staticBuzzGain = ctx.createGain();
          this.staticBuzzOsc.type = 'sawtooth';
          this.staticBuzzOsc.frequency.setValueAtTime(92, ctx.currentTime);
          this.staticBuzzGain.gain.setValueAtTime(0.01, ctx.currentTime);
          this.staticBuzzOsc.connect(this.staticBuzzGain);
          this.staticBuzzGain.connect(ctx.destination);
          this.staticBuzzOsc.start();
        }

        const vol = Math.min(0.28, Math.max(0.04, intensityFactor * 0.22)) * this.game._getEffectiveVolume();
        this.staticBuzzGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
        this.staticBuzzOsc.frequency.setTargetAtTime(88 + Math.random() * 65, ctx.currentTime, 0.04);
      } catch (_) {}
    }

    _stopStaticBuzz() {
      if (this.staticBuzzOsc) {
        try {
          this.staticBuzzOsc.stop();
          this.staticBuzzOsc.disconnect();
        } catch (_) {}
        this.staticBuzzOsc = null;
        this.staticBuzzGain = null;
      }
    }

    update(delta, elapsed) {
      const camPos = this.game.camera ? this.game.camera.position : null;

      // 1. Subtle Fluorescent Pulse pada Lampu Neon Langit-Langit Lobi (jika belum padam oleh event Mata Merah)
      if (this.lobbyNeonLight && this.lobbyNeonMat && !this.hasTriggeredCorridorRedEyes) {
        const pulse = Math.sin(elapsed * 3.2) * 0.08 + Math.cos(elapsed * 14.5) * 0.03;
        this.lobbyNeonLight.intensity = 0.92 + pulse;
        this.lobbyNeonMat.emissiveIntensity = 0.2 + pulse * 0.35;
      }

      // 2. Partikel Kilau Kunci Ruang Panel 3B
      if (this.stairwellKeyMesh && !this.hasMaintenanceKey) {
        this.stairwellKeyMesh.rotation.y = -0.55 + Math.sin(elapsed * 2.0) * 0.1;
        if (this.keyGlintMat) {
          const baseOp = this.game.flashlightOn ? 0.95 : 0.42;
          this.keyGlintMat.opacity = baseOp * (0.65 + 0.35 * Math.sin(elapsed * 6.5));
          this.keyGlintMat.size = this.game.flashlightOn ? 0.045 : 0.026;
        }
      }

      // 3. Animasi Lerp Gorden Jendela Lobi (0.8 detik)
      if (this.isCurtainAnimating && this.curtainLeft && this.curtainRight) {
        const progress = Math.min(
          1,
          (performance.now() - this.curtainAnimStart) / (this.curtainAnimDuration * 1000)
        );
        const eased = 1 - Math.pow(1 - progress, 3);

        this.curtainLeft.position.x = 6.22 + (4.85 - 6.22) * eased;
        this.curtainLeft.scale.x = 1.0 - 0.78 * eased;

        this.curtainRight.position.x = 9.58 + (10.95 - 9.58) * eased;
        this.curtainRight.scale.x = 1.0 - 0.78 * eased;

        if (progress >= 1) {
          this.isCurtainAnimating = false;
          this.areCurtainsOpen = true;
        }
      }

      // 4. Kilatan Petir Redup di Kejauhan Luar Jendela
      if (this.skyFlashLight) {
        this.skyFlashTimer += delta;
        if (this.skyFlashTimer >= this.nextSkyFlashIn) {
          this.skyFlashTimer = 0;
          this.nextSkyFlashIn = 4.5 + Math.random() * 6.5;
          this.skyFlashLight.intensity = 1.45 + Math.random() * 0.75;
        } else {
          this.skyFlashLight.intensity += (0.14 - this.skyFlashLight.intensity) * Math.min(1, delta * 5.0);
        }
      }

      // 4B. Sembunyikan gedung skyline luar jendela saat pemain berada di dalam Ruang Panel 3B / Basement
      if (this.skylineGroup && camPos) {
        this.skylineGroup.visible = (camPos.z > -18.5 && camPos.y > -0.15);
      }

      // 5. Tombol Lift menyala kuning kehijauan (0xc8ff33) dan berdengung pelan saat daya aktif
      if (this.elevatorErrorLight && this.elevatorButtonMat) {
        if (this.isElevatorPowered) {
          const humPulse = 1.25 + Math.sin(elapsed * 6.0) * 0.15;
          this.elevatorErrorLight.color.setHex(0xc8ff33);
          this.elevatorErrorLight.intensity = humPulse;
          this.elevatorButtonMat.color.setHex(0xc8ff33);
        } else {
          const blink = Math.sin(elapsed * 8.5) > 0;
          this.elevatorErrorLight.intensity = blink ? 0.55 : 0.06;
          this.elevatorButtonMat.color.setHex(blink ? 0xff1a1a : 0x3a0505);
        }
      }

      // 5A. Animasi Pintu Kabin Lift Utama (0 = tertutup, 1.0 = terbuka penuh, 0.5 = terbuka paksa 50% di Lantai 2)
      if (this.mainElevatorLeftDoor && this.mainElevatorRightDoor) {
        this.elevatorDoorOpenFactor += (this.targetElevatorDoorFactor - this.elevatorDoorOpenFactor) * Math.min(1, delta * 4.5);
        const slideOffset = this.elevatorDoorOpenFactor * 0.62;
        this.mainElevatorLeftDoor.position.x = -0.32 - slideOffset;
        this.mainElevatorRightDoor.position.x = 0.32 + slideOffset;
      }

      // Getaran halus selama kabin lift bergerak turun menuju lantai dasar (TANPA mengunci posisi WASD pemain!)
      if (this.isElevatorDescending && this.game.camera) {
        this.game.camera.rotation.z = Math.sin(elapsed * 28.0) * 0.004;
      }

      // 5B-2. Update Lingkungan, Audio Air, Rintangan Listrik, & Pengejaran Lantai 2 (The Flooded Ward)
      if (this.isOnFloorTwo && this.floorTwoGroup && this.floorTwoGroup.visible && camPos) {
        // Riak halus genangan air setinggi mata kaki
        if (this.floorTwoWaterMesh) {
          this.floorTwoWaterMesh.position.y = 0.078 + Math.sin(elapsed * 2.4) * 0.005;
        }

        // Kedipan & dengung halus Penunjuk Arah Darurat Hijau (Emergency Exit Signs #22c55e, intensitas 1.2)
        (this.floorTwoExitSignLights || this.floor2ExitSignLights || []).forEach((item) => {
          const flk = Math.sin(elapsed * 9.0 + item.phase) * Math.cos(elapsed * 19.0 + item.phase);
          const intensity = flk < -0.72 ? 0.45 : 1.2;
          item.light.intensity = intensity;
          item.mat.emissiveIntensity = intensity * 0.9;
        });

        // Trigger Sekuens Merayap Keluar Lift (Crawl Escape) saat keluar melewati celah pintu lift (z <= -10.0)
        if (!this.hasTriggeredFloor2EnterMonologue && camPos.z <= -10.0) {
          this._triggerFloor2CrawlExitSequence();
        }

        // SFX Langkah Kaki Deburan Air Basah (sfx_water_footsteps.mp3) saat bergerak di genangan Lantai 2
        const isMoving = Boolean(
          this.game.moveInput &&
          (this.game.moveInput.forward || this.game.moveInput.backward || this.game.moveInput.left || this.game.moveInput.right)
        );
        if (isMoving && camPos.z < -9.7 && !this.isFloor2StairDoorSlammedSafe && !this.isOnFloorOne && !this.isCutsceneLocked) {
          this.waterStepTimer += delta;
          const stepInterval = this.game.isSprinting ? 0.34 : (this.game.isCrouching ? 0.78 : 0.56);
          if (this.waterStepTimer >= stepInterval) {
            this.waterStepTimer = 0;
            this.game.playOneShotSfx('assets/audio/sfx_water_footsteps.mp3');
          }
        } else {
          this.waterStepTimer = 0.25;
        }

        // Bahaya Air Berlistrik (Electrified Water Hazard) di Koridor Timur (x = 18.6, z = -17.5)
        if (this.isFloor2BreakerOn) {
          // Kedipan percikan api listrik biru-putih
          if (this.electricSparkLight && this.electricArcMat) {
            const spk = Math.random() > 0.25 ? (1.8 + Math.random() * 1.8) : 0.25;
            this.electricSparkLight.intensity = spk;
            this.electricArcMat.opacity = Math.min(0.95, spk * 0.35);
          }

          // Looping SFX percikan listrik (sfx_electric_spark_loop.mp3) saat berada dalam jarak dengar (<= 11m)
          const distToCable = Math.hypot(camPos.x - 18.6, camPos.z - (-17.5));
          if (distToCable <= 11.5) {
            this.sparkAudioLoopTimer += delta;
            if (this.sparkAudioLoopTimer >= 3.05) {
              this.sparkAudioLoopTimer = 0;
              this.game.playOneShotSfx('assets/audio/sfx_electric_spark_loop.mp3');
            }
          }

          // Peringatan jarak 3 meter dari zona air berlistrik (maya_spark_warning.mp3 — 12000ms)
          if (
            !this.hasPlayedSparkWarningMonologue &&
            !this.game.isMayaSpeaking &&
            distToCable <= 4.6 &&
            camPos.x >= 15.8
          ) {
            this.hasPlayedSparkWarningMonologue = true;
            this.isActionBusy = true;
            this.game.playOneShotSfx('assets/audio/sfx_electric_spark_loop.mp3');
            this.game.setObjective('Temukan kotak sekring untuk memutus aliran listrik di genangan air.');
            this._playExactTimedMonologue(
              'assets/audio/maya_spark_warning.mp3',
              12000,
              'MAYA',
              'Kabel bertegangan menyentuh genangan air! Kalau aku melangkah ke sana, aku mati. Kotak sekringnya pasti ada di salah satu kamar ini.'
            );
          }

          // Box3 Trigger Zone: Jika melangkah masuk ke air berlistrik saat sekring masih menyala -> Game Over instan!
          if (this.electrifiedWaterBox3 && this.electrifiedWaterBox3.containsPoint(camPos)) {
            this._triggerElectrocutionGameOver();
          }
        }

        // Animasi Saklar Kotak Sekring Kamar 203 Turun
        if (this.isBreakerLeverAnimating && this.floor2BreakerLeverPivot) {
          const bt = Math.min(1, (performance.now() - this.breakerLeverAnimStart) / 420);
          this.floor2BreakerLeverPivot.rotation.z = -0.45 + bt * 0.95;
          if (bt >= 1) {
            this.isBreakerLeverAnimating = false;
          }
        }

        // Animasi Rantai & Gembok Jatuh ke Air saat Kode 7-4-2 Terbuka
        if (this.isChainsFalling) {
          this.chainsFallTimer += delta;
          const dropY = Math.max(0.08, 1.10 - this.chainsFallTimer * this.chainsFallTimer * 4.5);
          if (this.floor2ChainsGroup) this.floor2ChainsGroup.position.y = dropY;
          if (this.padlockMesh) this.padlockMesh.position.y = dropY;
          if (dropY <= 0.085) {
            this.isChainsFalling = false;
          }
        }

        // Animasi Pintu Tangga Darurat Lantai 2 Membuka
        if (this.isFloor2StairDoorAnimating && this.floor2StairDoorPivot) {
          const st = Math.min(1, (performance.now() - this.floor2StairDoorAnimStart) / 900);
          this.floor2StairDoorPivot.rotation.y = st * (Math.PI * 0.48);
          if (st >= 1) {
            this.isFloor2StairDoorAnimating = false;
          }
        }

        // Sekuens Pengejaran Air (Water Dash Scare): Entitas mengejar dari belakang menuju pintu tangga darurat!
        if (this.isFloor2WaterChaseActive && this.floor2ChaseEntity && this.floor2ChaseEntity.visible) {
          updateShadowEntityVertices(this.floor2ChaseEntity, elapsed);
          this.floor2ChaseEntity.lookAt(camPos.x, 0, camPos.z);
          this.floor2ChaseEntity.position.x = Math.max(4.35, this.floor2ChaseEntity.position.x - delta * 3.2);
        }

        // Begitu pemain melangkah masuk ke bordes tangga darurat (x <= 3.72), banting pintu besi menutup rapat!
        if (
          this.isFloor2StairDoorOpen &&
          !this.isFloor2StairDoorSlammedSafe &&
          camPos.x <= 3.72 &&
          camPos.z >= -12.4 &&
          camPos.z <= -9.8
        ) {
          this._slamFloor2EmergencyStairDoorSafe();
        }

        // Deteksi jarak dekat Pintu Darurat "Lantai 1 - Area Staf" di ujung bawah tangga (z = +1.5)
        // agar tombol [E] selalu responsif saat pemain tiba di bordes bawah tangga!
        if (
          !this.isFloor1EntryDoorOpen &&
          !this.isFloor1EntryDoorAnimating &&
          !this.game.isCommunicationActive &&
          camPos.x >= 0.8 &&
          camPos.x <= 3.0 &&
          camPos.z >= -0.5 &&
          camPos.z <= 1.5 &&
          !this.game.currentHoveredTarget
        ) {
          this.game.currentHoveredTarget = 'floor1_stair_exit_door';
          this.game._setInteractionPrompt('[E] Buka Pintu Darurat (Lantai 1 - Area Staf)');
        }

        // Animasi Pintu Darurat "Lantai 1 - Area Staf" Membuka (z = +1.5)
        if (this.isFloor1EntryDoorAnimating && this.floor1StairExitDoorPivot) {
          const dt = Math.min(1, (performance.now() - this.floor1EntryDoorAnimStart) / 950);
          const eased = 1 - Math.pow(1 - dt, 3);
          this.floor1StairExitDoorPivot.rotation.y = -eased * (Math.PI * 0.48);
          if (dt >= 1) {
            this.isFloor1EntryDoorAnimating = false;
          }
        }

        // Kedipan Halus Lampu Neon Remang di Koridor Staf Lantai 1
        if (Array.isArray(this.floor1StaffNeonLights)) {
          this.floor1StaffNeonLights.forEach((item) => {
            const wave = Math.sin(elapsed * 6.5 + item.phase) * Math.cos(elapsed * 17.0 + item.phase);
            const inten = wave < -0.78 ? 0.28 : 0.68;
            if (item.light) item.light.intensity = inten;
            if (item.mat) item.mat.emissiveIntensity = inten * 0.82;
          });
        }

        // Logika Radio HT di Atas Meja Keamanan Lantai 1 (x = 1.08, y = -3.41, z = +7.8)
        if (this.radioHTMesh && !this.hasPickedUpRadioHT) {
          const distToRadioDesk = Math.hypot(camPos.x - 1.08, camPos.z - 7.8);

          // Proximity Trigger 2.5 meter: Radio mulai berderau memanggil (sfx_radio_static_call.mp3)
          if (!this.hasTriggeredRadioStaticCall && camPos.y < -2.2 && distToRadioDesk <= 2.5) {
            this.hasTriggeredRadioStaticCall = true;
            this.isRadioRinging = true;
            this.game.playOneShotSfx('assets/audio/sfx_radio_static_call.mp3');
            this.game.setObjective('Ambil Radio HT di atas meja keamanan [E].');
          }

          // Tampilkan prompt "[E] Ambil Radio HT" saat pemain berada dalam radius 2.5m dari meja keamanan
          if (
            this.isRadioRinging &&
            distToRadioDesk <= 2.5 &&
            !this.game.isCommunicationActive &&
            !this.game.currentHoveredTarget
          ) {
            this.game.currentHoveredTarget = 'radio_ht';
            this.game._setInteractionPrompt('[E] Ambil Radio HT');
          }

          // Animasi Lampu LED Indikator Radio HT:
          // - Sebelum didekati: berkedip hijau pelan (0x22c55e)
          // - Saat memanggil (radius <= 2.5m): berkedip cepat bergantian hijau-merah (0x22c55e <-> 0xff1a1a)
          if (this.radioLEDMat && this.radioLEDLight) {
            if (this.isRadioRinging) {
              const fastToggle = Math.floor(elapsed * 10.0) % 2 === 0;
              const col = fastToggle ? 0x22c55e : 0xff1a1a;
              this.radioLEDMat.color.setHex(col);
              this.radioLEDLight.color.setHex(col);
              this.radioLEDLight.intensity = 1.65;
            } else {
              const slowPulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 2.6));
              this.radioLEDMat.color.setHex(0x22c55e);
              this.radioLEDLight.color.setHex(0x22c55e);
              this.radioLEDLight.intensity = slowPulse * 1.15;
            }
          }
        }

        // Animasi Pembukaan Pintu Double-Door di Ujung Koridor Staf Lantai 1 setelah Dialog Dhafir Selesai
        if (this.isFloor1DoubleDoorAnimating) {
          const ddt = Math.min(1, (performance.now() - this.floor1DoubleDoorAnimStart) / 1100);
          const eased = 1 - Math.pow(1 - ddt, 3);
          if (this.floor1DoubleDoorLeftPivot) {
            this.floor1DoubleDoorLeftPivot.rotation.y = -eased * (Math.PI * 0.46);
          }
          if (this.floor1DoubleDoorRightPivot) {
            this.floor1DoubleDoorRightPivot.rotation.y = eased * (Math.PI * 0.46);
          }
          if (ddt >= 1) {
            this.isFloor1DoubleDoorAnimating = false;
          }
        }

        // Pemicu Jebakan Ruang Arsip (Panic Archive Room):
        // Begitu seluruh badan pemain melangkah masuk melewati ambang pintu (z >= 18.35):
        if (
          this.isFloor1DoubleDoorUnlocked &&
          !this.hasTriggeredArchiveTrap &&
          camPos.y < -2.0 &&
          camPos.x >= -0.8 &&
          camPos.x <= 4.6 &&
          camPos.z >= 18.35
        ) {
          this._triggerPanicArchiveTrap();
        }

        // Animasi Pintu Hidrolik Terbanting Menutup Otomatis (0.22 detik)
        if (this.isArchiveDoorSlamAnimating) {
          const st = Math.min(1, (performance.now() - this.archiveDoorSlamStart) / 220);
          const rem = 1 - st;
          if (this.floor1DoubleDoorLeftPivot) {
            this.floor1DoubleDoorLeftPivot.rotation.y = -rem * (Math.PI * 0.46);
          }
          if (this.floor1DoubleDoorRightPivot) {
            this.floor1DoubleDoorRightPivot.rotation.y = rem * (Math.PI * 0.46);
          }
          if (st >= 1) {
            this.isArchiveDoorSlamAnimating = false;
          }
        }

        // Kedipan Konslet Panel Kunci Elektronik Ruang Arsip
        if (this.archiveElectronicSparkLight && this.archiveElectronicPanelMat) {
          const spk = Math.random() > 0.86 ? 1.6 : 0.35;
          this.archiveElectronicSparkLight.intensity = spk;
          this.archiveElectronicPanelMat.color.setHex(spk > 1.0 ? 0xffaa44 : 0x991b1b);
        }

        // Animasi Pintu Hidrolik Tumbang ke Depan & Partikel Asap/Api saat Ditembak Dhafir (Babak 7)
        if (this.isArchiveBreachAnimating && this.archiveExitDoorPivot) {
          const bt = Math.min(1, (performance.now() - this.archiveBreachAnimStart) / 680);
          const eased = bt * bt;
          // Pintu tumbang ke depan (menuju koridor lobi z > 24.5)
          this.archiveExitDoorPivot.rotation.x = eased * (Math.PI * 0.48);
          this.archiveExitDoorPivot.position.y = -4.2 - eased * 0.04;
          if (this.archiveHingeSparksMat) {
            this.archiveHingeSparksMat.opacity = Math.max(0, 1 - bt * 1.2);
          }
          if (this.archiveBreachFlashLight) {
            this.archiveBreachFlashLight.intensity = Math.max(0, (1 - bt) * 4.2);
          }
          if (bt >= 1) {
            this.isArchiveBreachAnimating = false;
          }
        }

        if (this.archiveHingeSmokeGroup && this.archiveHingeSmokeGroup.visible) {
          this.archiveHingeSmokeGroup.children.forEach((puff, idx) => {
            puff.position.y += delta * (0.18 + idx * 0.03);
            if (puff.position.y > 1.2) puff.position.y = -0.3;
          });
        }

        // Animasi Runtuhnya Pilar Utama Lobi (0.55 detik menghantam lantai)
        if (this.isLobbyPillarCollapsing && this.lobbyCollapsedPillarGroup) {
          const pt = Math.min(1, (performance.now() - this.lobbyPillarCollapseStart) / 550);
          const eased = pt * pt;
          this.lobbyCollapsedPillarGroup.position.y = -1.2 - eased * 3.0;
          if (pt >= 1) {
            this.isLobbyPillarCollapsing = false;
          }
        }

        // Pementasan Visual Tim "Code 0" (Shadow Movement di Kaca Buram & Muzzle Flash Point Lights)
        if (this.code0ShadowActive) {
          const nowSec = performance.now() * 0.001;
          this.code0ShadowSilhouettes.forEach((sil, idx) => {
            const wave = Math.sin(nowSec * sil.speed + sil.phase);
            sil.mesh.position.z = sil.baseZ + wave * 0.55;
            const flicker = (Math.sin(nowSec * 14.0 + idx * 2.1) > 0.15) ? 0.78 : 0.18;
            sil.mat.opacity = flicker;
          });

          if (this.code0MuzzleFlashTimer > 0) {
            this.code0MuzzleFlashTimer = Math.max(0, this.code0MuzzleFlashTimer - delta);
          }
          this.code0MuzzleFlashLights.forEach((mfLight, idx) => {
            const burst = this.code0MuzzleFlashTimer > 0 || Math.random() > 0.94;
            mfLight.intensity = burst && (Math.random() > 0.45) ? (2.4 + (idx % 2) * 1.2) : 0.0;
          });
        }

        // Update Visual Monitor CCTV Tabung Kamera 4 & Denyut Tentakel Biomekanik 3D Dr. Mark Evans
        if (this.isCctvCam4Active) {
          const nowSec = performance.now() * 0.001;
          this._updateCctvCamera4Canvas(nowSec);
          if (this.markHostage3DGroup && this.markHostage3DGroup.visible && !this.isMarkDroppedFromPillar) {
            this.markHostageTendrils.forEach((tendril, idx) => {
              const s = 1.0 + Math.sin(nowSec * 4.5 + idx) * 0.06;
              tendril.scale.set(s, s, 1.0);
            });
          }
        }

        // Kedipan Highlight Tuas Pemutus Daya Sektor 2 saat Siap Ditarik
        if (this.isSector2LeverReady && !this.hasPulledSector2Lever && this.sector2BreakerGlowLight) {
          this.sector2BreakerGlowLight.intensity = 1.2 + Math.sin(performance.now() * 0.012) * 0.8;
        }

        // Animasi Penarikan Tuas Pemutus Daya Sektor 2
        if (this.isSector2LeverAnimating && this.sector2BreakerHandlePivot) {
          const lt = Math.min(1, (performance.now() - this.sector2LeverAnimStart) / 320);
          this.sector2BreakerHandlePivot.rotation.z = -0.45 + lt * 0.95;
          if (lt >= 1) {
            this.isSector2LeverAnimating = false;
          }
        }

        // Pemicu Otomatis Masuk Pintu Ruang Kontrol (Security Hub Threshold Trigger):
        // Begitu pemain melangkah melewati ambang pintu masuk ke dalam Security Hub (x <= -2.65, z: 25.4..28.4),
        // daun pintu baja berayun menutup halus dari -90 derajat ke 0 derajat selama 0.8 detik & mengunci collider!
        if (
          this.isArchiveExitBreached &&
          !this.hasPlayerEnteredSecurityHub &&
          !this.isSecurityHubDoorLocked &&
          camPos.y < -2.0 &&
          camPos.x <= -2.65 &&
          camPos.x >= -6.8 &&
          camPos.z >= 25.4 &&
          camPos.z <= 28.4
        ) {
          this._lockSecurityHubDoorAndStartCode0();
        }

        // Interpolasi Lerp/Tween Halus Daun Pintu Security Hub (0.8 detik / 800ms)
        if (this.isSecurityHubDoorClosing && this.securityHubDoorPivot) {
          const dur = this.securityHubDoorAnimDuration || 800;
          const dt = Math.min(1, (performance.now() - this.securityHubDoorAnimStart) / dur);
          const eased = 1 - Math.pow(1 - dt, 3);
          this.securityHubDoorPivot.rotation.y =
            this.securityHubDoorFromAngle + (this.securityHubDoorToAngle - this.securityHubDoorFromAngle) * eased;
          if (this.securityHubBoltMesh) {
            this.securityHubBoltMesh.position.z = this.isSecurityHubExitDoorOpen
              ? (1.20 - eased * 0.22)
              : (0.98 + eased * 0.22);
          }
          if (dt >= 1) {
            this.isSecurityHubDoorClosing = false;
          }
        }

        // Rotasi Lampu Darurat Merah Berputar (Red Strobe Light) & Partikel Percikan Api Konsol saat Pemadaman Sektor 2
        if (this.isSector2BlackoutActive) {
          if (this.securityHubRedStrobePivot) {
            this.securityHubRedStrobePivot.rotation.y += delta * 9.5;
          }
          if (this.securityHubRedStrobeLight) {
            this.securityHubRedStrobeLight.intensity = 2.0 + Math.sin(elapsed * 18.0) * 1.1;
          }
          if (this.consoleBreakerSparksMat) {
            this.consoleBreakerSparksMat.opacity = Math.random() > 0.35 ? 0.92 : 0.18;
          }
        }

        // Rotasi Turbin Besar & Uap Bocor di Ruang Genset Lantai 1
        if (this.floor1TurbineRotor) {
          this.floor1TurbineRotor.rotation.z += delta * 1.45;
        }
        if (this.floor1SteamGroup) {
          this.floor1SteamGroup.children.forEach((puff, idx) => {
            puff.position.y += delta * (0.35 + idx * 0.05);
            if (puff.position.y > 1.8) puff.position.y = 0.0;
          });
        }

        // Patroli AI Monster Mengamuk di Koridor Sayap Barat & Kargo (westWingCargoEntity)
        if (this.isWestWingMonsterActive && this.westWingCargoEntity && this.westWingCargoEntity.visible) {
          this.westWingPatrolPhase += delta * 0.85;
          this.westWingCargoEntity.position.x = -4.2 + Math.sin(this.westWingPatrolPhase) * 2.6;
          this.westWingCargoEntity.position.z = 37.5 + Math.cos(this.westWingPatrolPhase * 0.7) * 2.8;
        }

        // Animasi Pembukaan Gerbang Lapis Baja Utama Bergeser ke Atas Perlahan (2.2 detik)
        if (this.isBlastDoorOpening) {
          const bt = Math.min(1, (performance.now() - this.blastDoorAnimStart) / 2200);
          const eased = 1 - Math.pow(1 - bt, 3);
          const liftY = -2.3 + eased * 3.55;
          if (this.mainArmoredGateLeft) this.mainArmoredGateLeft.position.y = liftY;
          if (this.mainArmoredGateRight) this.mainArmoredGateRight.position.y = liftY;
          if (bt >= 1) {
            this.isBlastDoorOpening = false;
          }
        }

        // Animasi Isyarat Tangan Dhafir di Ambang Pintu Belakang APC & Auto-Trigger Masuk Kabin APC
        if (this.isWaitingToBoardApc && !this.hasBoardedApc) {
          if (this.dhafirGestureArmPivot) {
            this.dhafirGestureArmPivot.rotation.x = -0.85 + Math.sin(elapsed * 5.5) * 0.35;
          }
          if (camPos && camPos.z >= 65.3 && camPos.x >= -5.2 && camPos.x <= -1.2) {
            this._enterTacticalApcCabinSequence();
          }
        }

        // Animasi Pintu Belakang Kendaraan Taktis APC Terbanting Menutup Rapat
        if (this.isApcRearDoorClosing) {
          const vt = Math.min(1, (performance.now() - this.apcRearDoorAnimStart) / 340);
          const rem = 1 - vt;
          if (this.apcRearDoorLeftPivot) {
            this.apcRearDoorLeftPivot.rotation.y = -rem * (Math.PI * 0.62);
          }
          if (this.apcRearDoorRightPivot) {
            this.apcRearDoorRightPivot.rotation.y = rem * (Math.PI * 0.62);
          }
          if (vt >= 1) {
            this.isApcRearDoorClosing = false;
          }
        }

        // Animasi Getar Bahu Pelan Wanita Penyintas & Goyangan Kendaraan APC saat Melaju Kencang
        if (this.isInApcCabin) {
          if (this.civWomanShoulders) {
            this.civWomanShoulders.position.x = Math.sin(elapsed * 22.0) * 0.008;
            this.civWomanShoulders.position.y = Math.cos(elapsed * 18.0) * 0.006;
          }
          if (this.isApcDriving && this.game.camera) {
            this.apcDriveTimer += delta;
            this.game.camera.position.x = -3.2 + Math.sin(elapsed * 28.0) * 0.016;
            this.game.camera.position.y = -2.85 + Math.cos(elapsed * 34.0) * 0.014;
          }
        }
      }

      // 5B. Update Layar Monitor Tabung CCTV (Pemain tetap bebas menggerakkan kamera & berjalan!)
      this._updateCctvMonitorCanvas(elapsed);
      if (this.isCctvInspecting) {
        this.cctvInspectTimer += delta;
      }

      // 5C. Animasi Rotasi Tuas Generator Turun 45 Derajat (Math.PI / 4) & Getaran Mesin
      if (this.isLeverAnimating && this.generatorLeverPivot) {
        const lt = Math.min(1, (performance.now() - this.leverAnimStart) / 480);
        this.generatorLeverPivot.rotation.x = -0.35 + lt * (Math.PI / 4 + 0.35);
        if (lt >= 1) {
          this.isLeverAnimating = false;
        }
      }
      if (this.isGeneratorRunning && this.generatorGroup) {
        this.generatorGroup.position.x = 3.9 + Math.sin(elapsed * 48.0) * 0.008;
        this.generatorGroup.position.y = -4.4 + Math.cos(elapsed * 54.0) * 0.006;
      }

      // 5D. Animasi Jumpscare Lari Cepat (Dash / Flicker Encounter) di Basement (0.5 detik)
      if (this.isBasementDashAnimating && this.basementDashEntity) {
        updateShadowEntityVertices(this.basementDashEntity, elapsed);
        const dt = Math.min(1, (performance.now() - this.basementDashStart) / 500);
        // Melesat sangat kencang melintasi celah antara dua pilar beton (-0.8 ke +8.2)
        this.basementDashEntity.position.x = -0.8 + dt * 9.0;
        this.basementDashEntity.position.y = -4.4 + Math.abs(Math.sin(dt * Math.PI * 6)) * 0.12;
        if (dt >= 1) {
          this.isBasementDashAnimating = false;
          this.basementDashEntity.visible = false;
        }
      }

      // 6. Animasi Pintu Kamar 304 Membuka Lebih Lebar
      if (this.isRoom304Animating && this.room304DoorPivot) {
        const t = Math.min(1, (performance.now() - this.room304AnimStart) / (this.room304AnimDuration * 1000));
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.room304DoorPivot.rotation.y = 0.62 + eased * (Math.PI / 2 - 0.62);
        if (t >= 1) {
          this.isRoom304Animating = false;
          this.room304TargetAngle = Math.PI / 2;
        }
      }

      // 7. Animasi Pintu Maintenance 3B Membuka 90 Derajat ke Dalam
      if (this.isMaintenance3BAnimating && this.maintenance3BDoorPivot) {
        const t = Math.min(1, (performance.now() - this.maintenance3BAnimStart) / 1400);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        this.maintenance3BDoorPivot.rotation.y = eased * (Math.PI / 2);
        if (t >= 1) {
          this.isMaintenance3BAnimating = false;
          this.isMaintenance3BOpen = true;
        }
      }

      // 8. Getaran Daun Pintu Kamar 307 saat Benturan Berat
      if (this.room307ThudTimer > 0 && this.room307DoorGroup) {
        this.room307ThudTimer -= delta;
        this.room307DoorGroup.position.z = -14.91 + Math.sin(elapsed * 55) * 0.025;
        if (this.room307ThudTimer <= 0) {
          this.room307DoorGroup.position.z = -14.91;
        }
      }

      // 9. Cek Pandangan Pemain & Vertex Animation Entitas
      this._updateEntityGazeCheck(delta, elapsed);

      if (!camPos) return;

      // 10. Trigger Masuk Kamar 304 (berurutan tanpa menimpa dialog aktif)
      if (
        !this.hasEnteredRoom304 &&
        !this.game.isCommunicationActive &&
        camPos.x >= 13.5 &&
        camPos.x <= 16.2 &&
        camPos.z <= -15.22
      ) {
        this._triggerRoom304EnterSequence();
      }

      // 10B. Trigger Masuk Ruang Panel 3B (berurutan tanpa menimpa dialog aktif)
      if (
        this.isMaintenance3BOpen &&
        !this.hasEnteredMaintenance3B &&
        !this.game.isCommunicationActive &&
        camPos.x >= 0.0 &&
        camPos.x <= 5.8 &&
        camPos.z <= -17.85
      ) {
        this._triggerEnterMaintenance3B();
      }

      // 10C. Atmosfer Tetesan Air Bergaung di Tangga & Basement (z < -23.0)
      if (camPos.z < -23.0) {
        this.dripTimer += delta;
        if (this.dripTimer > 3.2 + Math.random() * 2.5) {
          this.dripTimer = 0;
          this.game._playProceduralClickSfx(980 + Math.random() * 240);
        }
      }

      // 10E. Munculkan Entitas Pengintai (Stalker Entity) untuk Mekanik Tatapan Fatal saat kembali ke atas setelah generator nyala
      if (
        this.isGeneratorRunning &&
        !this.isElevatorCabinOpen &&
        !this.isOnFloorTwo &&
        this.stalkerShadowEntity
      ) {
        if (camPos.z > -32.0 && camPos.z < -17.6) {
          // Saat pemain menaiki tangga kembali ke Ruang Panel 3B, entitas mengintai di sudut ruangan
          this.stalkerShadowEntity.position.set(1.1, 0, -19.0);
          this.stalkerShadowEntity.visible = true;
          this.isStalkerEntityActive = true;
        } else if (camPos.z >= -17.6 && camPos.z < -10.2) {
          // Saat pemain keluar ke lobi lantai 3 menuju lift, entitas berdiri di sisi lobi
          this.stalkerShadowEntity.position.set(3.8, 0, -13.4);
          this.stalkerShadowEntity.visible = true;
          this.isStalkerEntityActive = true;
        }
      }

      // 10D. Trigger Jumpscare Lari Cepat (Dash / Flicker Encounter) saat jarak <= 4m dari Generator Basement
      if (
        !this.hasTriggeredBasementDash &&
        camPos.z < -37.0 &&
        Math.hypot(camPos.x - 3.9, camPos.z - (-44.2)) <= 4.3
      ) {
        this.hasTriggeredBasementDash = true;
        this.isBasementDashAnimating = true;
        this.basementDashStart = performance.now();
        if (this.basementDashEntity) {
          this.basementDashEntity.position.set(-0.8, -4.4, -41.3);
          this.basementDashEntity.rotation.y = Math.PI / 2;
          this.basementDashEntity.visible = true;
        }
        // Putar audio SFX hembusan kencang dan jeritan distorsi tajam: sfx_creature_dash.mp3
        this.game.playOneShotSfx('assets/audio/sfx_creature_dash.mp3');
        // Camera shake tajam sesaat (0.45 detik)
        this.game.cameraShakeDuration = 0.45;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.065;
      }

      // 11. Trigger Kemunculan Mata Merah di Koridor Luar saat Maya melangkah keluar dari Kamar 304
      if (
        this.hasMaintenanceKey &&
        !this.isRoom304TrapLocked &&
        !this.hasTriggeredCorridorRedEyes &&
        camPos.z >= -14.85
      ) {
        this._triggerCorridorRedEyesEvent();
      }

      // 12. Event 1 Environmental Screamer: Lift Drop Shudder
      if (
        !this.hasTriggeredElevatorDrop &&
        camPos.x >= 4.2 &&
        camPos.x <= 8.6 &&
        camPos.z >= -14.2 &&
        camPos.z <= -9.6
      ) {
        this.hasTriggeredElevatorDrop = true;
        this.game.cameraShakeDuration = 0.5;
        this.game.cameraShakeTimer = 0;
        this.game.cameraShakeIntensity = 0.062;
        this.game.playOneShotSfx('assets/audio/sfx_elevator_drop.mp3');
      }

      // 13. Event 2 Environmental Screamer: Pot Bunga / Vas Jatuh Pecah
      if (
        !this.hasTriggeredVaseDrop &&
        camPos.x >= 16.0 &&
        camPos.z >= -15.0 &&
        camPos.z <= -11.8
      ) {
        this.hasTriggeredVaseDrop = true;
        this.isVaseFalling = true;
        this.vaseFallStart = performance.now();
      }

      if (this.isVaseFalling && this.vaseMesh) {
        const ft = Math.min(1, (performance.now() - this.vaseFallStart) / (this.vaseFallDuration * 1000));
        this.vaseMesh.position.y = 0.90 - (ft * ft) * 0.86;
        this.vaseMesh.position.z = -12.52 - ft * 0.40;
        this.vaseMesh.rotation.x = ft * Math.PI * 2.4;
        this.vaseMesh.rotation.z = ft * 1.8;

        if (ft >= 1) {
          this.isVaseFalling = false;
          this.vaseMesh.visible = false;
          if (this.vaseShardsGroup) {
            this.vaseShardsGroup.visible = true;
          }
          this.game.playOneShotSfx('assets/audio/sfx_vase_break.mp3');
        }
      }

      // Animasi Halus Kamar Rumah Sakit (Dr. Mark Evans menatap Maya & Gorden Jendela Berayun Lembut)
      if (this.isInHospitalBed && this.hospitalRoomGroup && this.hospitalRoomGroup.visible) {
        if (this.hospitalMarkHead) {
          this.hospitalMarkHead.rotation.y = Math.sin(elapsed * 1.1) * 0.06;
          this.hospitalMarkHead.rotation.x = Math.cos(elapsed * 1.4) * 0.03;
        }
        if (this.hospitalCurtainLeft && this.hospitalCurtainRight) {
          this.hospitalCurtainLeft.position.z = -1.75 + Math.sin(elapsed * 1.6) * 0.02;
          this.hospitalCurtainRight.position.z = 0.15 - Math.sin(elapsed * 1.6) * 0.02;
        }
      }

      // Animasi Epilog: Tur Lorong Medis, Pintu Geser Otomatis, Fade-In BGM, & Slow Dolly/Pan Fajar
      if (this.isInEpilogueWalk && this.hospitalRoomGroup && this.hospitalRoomGroup.visible) {
        // 1. Dr. Mark Evans berjalan memandu di depan Maya menuju Ruang Arsip (z = -1.65 -> -21.2)
        if (this.isMarkLeadingTour && this.hospitalMarkGroup) {
          if (this.hospitalMarkGroup.position.z > -21.2) {
            this.hospitalMarkGroup.position.z = Math.max(-21.2, this.hospitalMarkGroup.position.z - delta * 1.85);
            const walkCycle = elapsed * 6.5;
            if (this.markLeftLegPivot) this.markLeftLegPivot.rotation.x = Math.sin(walkCycle) * 0.42;
            if (this.markRightLegPivot) this.markRightLegPivot.rotation.x = -Math.sin(walkCycle) * 0.42;
            if (this.markLeftArmPivot) this.markLeftArmPivot.rotation.x = -Math.sin(walkCycle) * 0.28;
            if (this.markRightArmPivot) this.markRightArmPivot.rotation.x = Math.sin(walkCycle) * 0.28;
          } else {
            this.hospitalMarkGroup.rotation.y = Math.PI * 0.85;
            if (this.markLeftLegPivot) this.markLeftLegPivot.rotation.x = 0;
            if (this.markRightLegPivot) this.markRightLegPivot.rotation.x = 0;
          }
        }

        // 2. Animasi Pintu Geser Otomatis Koridor Medis Membuka ke Kiri & Kanan
        if (this.isMedicalSlidingDoorAnimating) {
          const st = Math.min(1, (performance.now() - this.medicalSlidingDoorAnimStart) / 900);
          const eased = 1 - Math.pow(1 - st, 3);
          if (this.medicalSlidingDoorLeft) {
            this.medicalSlidingDoorLeft.position.x = -0.58 - eased * 1.05;
          }
          if (this.medicalSlidingDoorRight) {
            this.medicalSlidingDoorRight.position.x = 0.58 + eased * 1.05;
          }
          if (st >= 1) {
            this.isMedicalSlidingDoorAnimating = false;
          }
        }

        // 3. Fade-in bertahap volume bgm_bittersweet_ending.mp3 (menuju 0.25 lalu 0.7)
        if (this.endingBgmAudio && this.endingBgmTargetVol > 0) {
          const curV = this.endingBgmAudio.volume || 0;
          if (Math.abs(this.endingBgmTargetVol - curV) > 0.005) {
            this.endingBgmAudio.volume = Math.max(0, Math.min(1, curV + (this.endingBgmTargetVol - curV) * Math.min(1, delta * 1.5)));
          }
        }

        // 4. Slow Dolly/Pan Kamera saat Monolog Refleksi Terakhir Maya (Menyorot Radio HT & Jendela Fajar)
        if (this.isFinalReflectionDollyActive && this.game.camera) {
          this.finalDollyTimer += delta;
          const dt = Math.min(1, this.finalDollyTimer / 11.5);
          this.game.camera.position.x += (2.25 - this.game.camera.position.x) * Math.min(1, delta * 0.65);
          this.game.camera.position.z += (-19.2 - this.game.camera.position.z) * Math.min(1, delta * 0.65);
          this.game.yaw += (-Math.PI / 2 - this.game.yaw) * Math.min(1, delta * 0.85);
          this.game.pitch += (-0.06 - this.game.pitch) * Math.min(1, delta * 0.85);
          this.game.camera.rotation.set(this.game.pitch, this.game.yaw, 0, 'YXZ');
          if (this.mayaPocketRadioMesh) {
            this.mayaPocketRadioMesh.position.y = -0.22 + Math.sin(dt * Math.PI) * 0.04;
          }
        }
      }
    }
  }

  window.Blindspot.createShadowRedEyesEntity = createShadowRedEyesEntity;
  window.Blindspot.updateShadowEntityVertices = updateShadowEntityVertices;
  window.Blindspot.FloorThreeExpansion = FloorThreeExpansion;
})(window);

/**
 * ============================================================================
 * BLINDSPOT — FPP 3D BEDROOM, L-SHAPED HALLWAY & GAMEPLAY SCENE MODULE
 * File: ./gameScene.js
 * ============================================================================
 */
(function (window) {
  'use strict';

  window.Blindspot = window.Blindspot || {};
  // Status global apakah ada audio dialog/komunikasi (Monolog, Telepon, atau Radio HT) yang sedang aktif
  let isCommunicationActive = false;

  // Flag pelacak panggilan sekali pakai (One-Time Phone Call)
  const callFlags = {
    markRoomCompleted: false,
    momCallCompleted: false
  };

  window.isCommunicationActive = false;
  window.callFlags = callFlags;
  window.isMayaSpeaking = false;

  const OPENING_MONOLOGUE_SEQUENCE = Object.freeze([
    {
      file: 'assets/audio/game_start_01.mp3',
      duration: 6000,
      delayAfter: 1000,
      speaker: 'MAYA',
      text: 'Ugh... kepalaku. Rekaman tadi... itu bukan cuma mimpi buruk.'
    },
    {
      file: 'assets/audio/game_start_02.mp3',
      duration: 6000,
      delayAfter: 1000,
      speaker: 'MAYA',
      text: 'Lampu di lantai tiga... semua pintunya terkunci rapat. Aku harus mencari jalan keluar.'
    },
    {
      file: 'assets/audio/game_start_03.mp3',
      duration: 8000,
      delayAfter: 800,
      speaker: 'MAYA',
      text: 'Tunggu... ada yang bergerak di ujung lorong. Jangan tatap langsung. Ingat... tetap fokus ke depan.',
      timedSfx: {
        triggerAtMs: 4000,
        file: 'assets/audio/sfx_shadow_footstep.mp3'
      }
    }
  ]);

  const PHONE_CALL_SEQUENCE = Object.freeze([
    {
      file: 'assets/audio/phone_01_friend.mp3',
      duration: 5000,
      delayAfter: 600,
      speaker: 'MARK [TELEPON]',
      text: 'Halo? Maya?! Syukurlah kamu angkat! Kamu di mana sekarang?!'
    },
    {
      file: 'assets/audio/phone_02_player.mp3',
      duration: 9000,
      delayAfter: 600,
      speaker: 'MAYA',
      text: 'Mark? Aku masih di kamarku... Kepalaku sakit sekali waktu bangun. Pintunya terkunci dari luar. Sebenarnya ada apa ini?'
    },
    {
      file: 'assets/audio/phone_03_friend.mp3',
      duration: 9000,
      delayAfter: 600,
      speaker: 'MARK [TELEPON]',
      text: 'Tetap di dalam! Jangan buka pintu dulu! Aliran listrik di lantai tiga padam total... Semuanya panik kabur, tapi ada hal lain di luar sini.'
    },
    {
      file: 'assets/audio/phone_04_player.mp3',
      duration: 7000,
      delayAfter: 600,
      speaker: 'MAYA',
      text: 'Hal lain? Rekaman suara tadi... apa itu beneran nyata? Mark, jangan bikin aku takut!'
    },
    {
      file: 'assets/audio/phone_05_friend.mp3',
      duration: 11000,
      delayAfter: 300,
      speaker: 'MARK [TELEPON]',
      text: 'Pokoknya jangan pernah tatap langsung ke arah bayangan itu! Tetap fokus ke depan, bawa sentermu, cari kuncinya, dan— tunggu... langkah kaki siapa di belakangku—'
    },
    {
      file: 'assets/audio/call_drop.mp3',
      duration: 3000,
      delayAfter: 400,
      speaker: 'SISTEM TELEPON',
      text: '[ PANGGILAN TERPUTUS - SINYAL HILANG ]',
      isCallDrop: true
    }
  ]);

  const MAYA_HALLWAY_PANIC_SEQUENCE = Object.freeze([
    {
      file: 'assets/audio/maya_hallway_01.mp3',
      duration: 3000,
      delayAfter: 800,
      speaker: 'MAYA',
      text: 'Nggak, nggak, nggak! Apaan itu barusan?!'
    },
    {
      file: 'assets/audio/maya_hallway_02.mp3',
      duration: 5000,
      delayAfter: 800,
      speaker: 'MAYA',
      text: 'Mark?! Itu kamu?! Tolong bilang kalau ini cuma lelucon bodoh...'
    },
    {
      file: 'assets/audio/maya_hallway_03.mp3',
      duration: 8000,
      delayAfter: 600,
      speaker: 'MAYA',
      text: 'Ponselnya... hancur total. Ada darah di layarnya. Dia lari melewati belokan itu.'
    }
  ]);

  const PRE_MOM_MONOLOGUE = Object.freeze({
    file: 'assets/audio/phone_pre_mom_01.mp3',
    duration: 14000,
    delayAfter: 800,
    speaker: 'MAYA',
    text: 'Ponsel Mark nggak ada sinyal... tunggu, punyaku masih ada satu bar. Grup chat mati total. Semua orang berhenti membalas dari beberapa jam lalu. Aku harus telepon Ibu... tolong angkat, tolong...'
  });

  const MOM_PHONE_CALL_SEQUENCE = Object.freeze([
    {
      file: 'assets/audio/phone_mom_01_mom.mp3',
      duration: 7000,
      delayAfter: 500,
      speaker: 'IBU [TELEPON]',
      text: 'Maya? Sayang?! Itu kamu? Kamu di mana sekarang? Berita-berita menyiarkan hal-hal aneh—'
    },
    {
      file: 'assets/audio/phone_mom_02_player.mp3',
      duration: 14000,
      delayAfter: 400,
      speaker: 'MAYA',
      text: 'Ibu! Aku terjebak di lantai tiga! Lampunya padam, Mark hilang, dan ada sesuatu di kegelapan... Bu, apa listrik di kotamu juga padam?! Aku takut banget... aku nggak tahu harus gimana!'
    },
    {
      file: 'assets/audio/phone_mom_03_mom.mp3',
      duration: 15000,
      delayAfter: 300,
      speaker: 'IBU [TELEPON]',
      text: 'Maya, dengarkan Ibu! Ini bukan cuma di gedungmu... seluruh jaringan kota padam dua puluh menit lalu. Lampu jalan, sirene... mereka bilang jangan lihat ke luar jendela, apa pun yang terjadi jangan— [derau statis kencang] —Maya?! Kamu bisa dengar Ibu?! Mereka ada di depan pint—'
    }
  ]);

  const POST_MOM_DESPAIR_MONOLOGUE = Object.freeze({
    file: 'assets/audio/phone_post_mom_01.mp3',
    duration: 9000,
    delayAfter: 1000,
    speaker: 'MAYA',
    text: 'Ibu?! Ibu!! Nggak, nggak, nggak... sinyalnya hilang. Seluruh kota...? Sebenarnya apa yang terjadi sama dunia ini...?'
  });

  const ENTITY_WHISPER_REACTION = Object.freeze({
    whisperFile: 'assets/audio/sfx_entity_whisper.mp3',
    whisperDuration: 5000,
    whisperDelayAfter: 500,
    reactionFile: 'assets/audio/phone_post_whisper_02.mp3',
    reactionDuration: 8000,
    speaker: 'MAYA [BERBISIK]',
    reactionText: '[tarikan napas kaget tertahan] Dia tepat di sampingku... jangan menoleh. Tetap lihat ke depan. Tarik napas. Jalan terus ke depan.'
  });

  let activeGameInstance = null;

  class BlindspotFPPGameScene {
    constructor(canvasElement, initialSettings) {
      this.canvas = canvasElement || document.getElementById('gameCanvas');
      this.settings = this._loadSettingsFromStorage(initialSettings);

      // Core Three.js Objects
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.clock = null;
      this.raycaster = null;
      this.centerScreenNDC = null;

      // Lights
      this.ambientLight = null;
      this.hemiLight = null;
      this.ceilingLight = null;
      this.ceilingBulbMesh = null;
      this.flashlight = null;
      this.flashlightOn = false;

      // Hallway Lights
      this.hallwayNeonLight = null;
      this.hallwayNeonTubeMesh = null;
      this.hallwayNeonBlown = false;
      this.cornerEmergencyLight = null;
      this.markPhoneLight = null;

      // Bedroom Ceiling Light Flicker State
      this.baseCeilingIntensity = 1.8;
      this.flickerState = {
        mode: 'normal',
        timer: 0,
        nextEventIn: 2.2
      };

      // Interactive Meshes & Pivots
      this.interactables = [];
      this.playerPhoneMesh = null;
      this.keyMesh = null;
      this.doorPivot = null;
      this.doorMesh = null;
      this.markPhoneMesh = null;
      this.markPhonePosition = null;
      this.shadowEntityMesh = null;
      this.currentHoveredTarget = null;

      // Strict Quest-Locking, Dialogue Input Lock & Radio Transmission Lock State
      this.gameState = gameState;
      this.gravityVelocity = 0;
      this.verticalVelocity = 0;
      this.isCommunicationActive = false;
      this.isMayaSpeaking = false;
      this.isRadioTransmitting = false;
      this.isPhoneCalling = false;
      this.isMarkCallCompleted = false;
      this.isMomCallCompleted = false;
      this.callFlags = callFlags;
      callFlags.markRoomCompleted = false;
      callFlags.momCallCompleted = false;
      isCommunicationActive = false;
      window.isCommunicationActive = false;
      this.hasRadioHT = false;
      this.isPaused = false;
      this.hasFoundPhone = false;
      this.talkedToMark = false;
      this.hasRoomKey = false;
      this.hasKey = false; // alias kompatibilitas
      this.isLocked = true; // Pintu keluar kamar terkunci secara default
      this.isDoorOpen = false;
      this.isDoorAnimating = false;
      this.doorAnimStartTime = 0;
      this.doorAnimDuration = 1.5;

      this.hasEnteredHallway = false;
      this.hasTriggeredCornerJumpscare = false;
      this.isShadowDartAnimating = false;
      this.shadowDartStartTime = 0;
      this.shadowDartDuration = 0.44;

      // Camera Shake State
      this.cameraShakeDuration = 0;
      this.cameraShakeTimer = 0;
      this.cameraShakeIntensity = 0;

      // Smartphone & Post-Jumpscare Mom Call / Whisper State
      this.isPhoneOpen = false;
      this.phoneCallState = 'idle';
      this.momPhonePhaseUnlocked = false;
      this.hasPlayedPreMomMonologue = false;
      this.isPreMomMonologuePlaying = false;
      this.momCallState = 'idle';
      this.isWhisperTerrorActive = false;
      this.phoneClockInterval = null;

      // Player Movement & Camera Euler State
      this.yaw = 0;
      this.pitch = 0;
      this.moveInput = { forward: false, backward: false, left: false, right: false };
      this.walkBobTimer = 0;
      this.playerHeight = 1.6;
      this.crouchHeight = 0.62;
      this.isCrouching = false;
      this.isSprinting = false;
      this.moveSpeed = 2.45;
      this.isBlinking = false;
      this.hasMaintenanceKey = false;
      this.hasStairwellKey = false;
      this.isElevatorPowered = false;
      this._sfxCtx = null;
      this._sharedMaterials = null;
      this.floorExpansion = null;

      // Safe Pointer Lock Controller Wrapper (controls.lock() / controls.unlock())
      this.controls = {
        isLocked: false,
        lock: () => this._lockPointer(),
        unlock: () => this._unlockPointer()
      };

      // Furniture Collision AABBs inside Bedroom
      this.furnitureColliders = [
        { minX: -3.0, maxX: -0.95, minZ: 0.55, maxZ: 3.0 },
        { minX: 1.15, maxX: 3.0, minZ: -3.0, maxZ: -1.45 },
        { minX: 1.95, maxX: 3.0, minZ: -0.25, maxZ: 1.65 }
      ];

      // Audio Sequencer & Pause-Aware Timers
      this.voAudio = new Audio();
      this.voAudio.preload = 'auto';
      this.wasVoPlayingBeforePause = false;
      this.heartbeatAudio = null;
      this.sfxAudioPool = [];
      this.activeTimers = [];
      this.pauseAwareTimers = [];
      this._nextTimerId = 1;
      this.isDisposed = false;
      this.rafId = null;

      this._bindDOMElements();
    }

    /**
     * Sistem Timer yang otomatis membeku saat game berada dalam kondisi Pause [ESC]
     */
    setPauseAwareTimeout(callback, delayMs) {
      const id = this._nextTimerId++;
      this.pauseAwareTimers.push({
        id,
        remainingMs: Math.max(0, delayMs),
        callback
      });
      return id;
    }

    clearPauseAwareTimeout(id) {
      this.pauseAwareTimers = this.pauseAwareTimers.filter((t) => t.id !== id);
    }

    _tickPauseAwareTimers(deltaSec) {
      if (this.isPaused || this.pauseAwareTimers.length === 0) return;
      const deltaMs = deltaSec * 1000;
      const due = [];
      for (let i = 0; i < this.pauseAwareTimers.length; i++) {
        const t = this.pauseAwareTimers[i];
        t.remainingMs -= deltaMs;
        if (t.remainingMs <= 0) {
          due.push(t);
        }
      }
      if (due.length > 0) {
        const dueIds = new Set(due.map((d) => d.id));
        this.pauseAwareTimers = this.pauseAwareTimers.filter((t) => !dueIds.has(t.id));
        due.forEach((d) => {
          try {
            d.callback();
          } catch (_) {}
        });
      }
    }

    /**
     * Pusat Kendali Status Komunikasi Tunggal (`isCommunicationActive`):
     * - Saat aktif (`true`): Gerakan WASD, [Shift/C] jongkok, [Space] kedip, [F] senter, dan Mouse Look TETAP AKTIF 100%,
     *   namun seluruh interaksi [E], pembukaan ponsel, dan tombol panggil DIKUNCI MATI serta prompt interaksi HUD disembunyikan.
     */
    respawnPlayer() {
      if (this.floorExpansion && this.floorExpansion.checkpointManager) {
        return this.floorExpansion.checkpointManager.respawnPlayer();
      }
      return null;
    }

    setCommunicationActive(active) {
      const nextState = Boolean(active);
      isCommunicationActive = nextState;
      this.isCommunicationActive = nextState;
      this.isMayaSpeaking = nextState;
      window.isCommunicationActive = nextState;
      window.isMayaSpeaking = nextState;

      if (nextState) {
        // Sembunyikan prompt interaksi di HUD (misal "[E] Ambil Kunci") selama ada komunikasi aktif
        this.currentHoveredObject = null;
        this.currentHoveredTarget = null;
        this._setInteractionPrompt('');
      }

      if (this.speakingLockBadgeEl) {
        this.speakingLockBadgeEl.textContent = this.isRadioTransmitting
          ? 'TRANSMISI RADIO AKTIF [INTERAKSI DIKUNCI]'
          : (this.isPhoneCalling
            ? 'PANGGILAN AKTIF [INTERAKSI DIKUNCI]'
            : 'DIALOG AKTIF [INTERAKSI DIKUNCI]');
        this.speakingLockBadgeEl.classList.toggle('active', nextState);
      }
    }

    setMayaSpeaking(speaking) {
      this.setCommunicationActive(Boolean(speaking) || Boolean(this.isRadioTransmitting) || Boolean(this.isPhoneCalling));
    }

    setRadioTransmitting(transmitting) {
      this.isRadioTransmitting = Boolean(transmitting);
      window.isRadioTransmitting = this.isRadioTransmitting;
      this.setCommunicationActive(this.isRadioTransmitting || Boolean(this.isPhoneCalling));
      if (this.radioHudBadge) {
        this.radioHudBadge.classList.toggle('transmitting-badge', this.isRadioTransmitting);
      }
      if (this.radioHudTextEl) {
        this.radioHudTextEl.textContent = this.isRadioTransmitting
          ? 'RADIO HT: TRANSMISI [CH-04]'
          : 'RADIO HT: AKTIF [CH-04]';
      }
    }

    /**
     * Menampilkan pesan peringatan singkat Objective Gating di HUD tanpa menghapus subtitle radio/telepon yang sedang aktif
     */
    showHUDWarning(message, durationMs = 2800) {
      if (!this.hudWarningEl) {
        let el = document.getElementById('fpp-hud-warning');
        if (!el) {
          el = document.createElement('div');
          el.id = 'fpp-hud-warning';
          el.style.cssText = [
            'position:fixed',
            'top:48%',
            'left:50%',
            'transform:translate(-50%, -50%)',
            'z-index:76',
            'background:rgba(45, 8, 8, 0.92)',
            'border:1px solid #ef4444',
            'padding:0.48rem 1.1rem',
            'font-family:"Share Tech Mono", monospace',
            'font-size:0.82rem',
            'letter-spacing:0.14em',
            'color:#fecaca',
            'text-transform:uppercase',
            'box-shadow:0 0 18px rgba(239, 68, 68, 0.45)',
            'pointer-events:none',
            'opacity:0',
            'transition:opacity 0.18s ease'
          ].join(';');
          const parent = document.getElementById('game-viewport-container') || document.body;
          parent.appendChild(el);
        }
        this.hudWarningEl = el;
      }
      this.hudWarningEl.textContent = message;
      this.hudWarningEl.style.opacity = '1';
      if (this.hudWarningTimer) {
        this.clearPauseAwareTimeout(this.hudWarningTimer);
      }
      this.hudWarningTimer = this.setPauseAwareTimeout(() => {
        if (this.hudWarningEl) {
          this.hudWarningEl.style.opacity = '0';
        }
        this.hudWarningTimer = null;
      }, durationMs);
    }

    _loadSettingsFromStorage(fallbackSettings) {
      const defaults = {
        masterVolume: 75,
        sfxVolume: 80,
        mouseSensitivity: 1.0,
        invertY: false,
        graphicsQuality: 'High',
        postProcessing: true
      };
      try {
        const raw =
          window.localStorage.getItem('blindspot_settings') ||
          window.localStorage.getItem('blindspot_horror_settings_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...defaults, ...fallbackSettings, ...parsed };
        }
      } catch (_) {}
      return { ...defaults, ...fallbackSettings };
    }

    _saveSettingsToStorage() {
      try {
        const s = JSON.stringify(this.settings);
        window.localStorage.setItem('blindspot_settings', s);
        window.localStorage.setItem('blindspot_horror_settings_v1', s);
      } catch (_) {}
    }

    _bindDOMElements() {
      this.eyelidsOverlay = document.getElementById('eyelids-overlay');
      this.objectiveTextEl = document.getElementById('fpp-objective-text');
      this.interactionPromptEl = document.getElementById('fpp-interaction-prompt');
      this.subtitleContainerEl = document.getElementById('fpp-subtitle-box');
      this.subtitleSpeakerEl = document.getElementById('fpp-subtitle-speaker');
      this.subtitleTextEl = document.getElementById('fpp-subtitle-text');
      this.speakingLockBadgeEl = document.getElementById('fpp-speaking-lock-badge');
      this.radioHudBadge = document.getElementById('fpp-radio-status');
      this.radioHudTextEl = document.getElementById('fpp-radio-status-text');
      this.flashlightHudBadge = document.getElementById('fpp-flashlight-status');
      this.keyHudBadge = document.getElementById('fpp-key-status');

      this.smartphoneEl = document.getElementById('diegetic-smartphone');
      this.phoneSignalEl = document.getElementById('phone-signal-indicator');
      this.phoneClockEl = document.getElementById('phone-glitch-clock');
      this.phoneStatusEl = document.getElementById('phone-call-status');
      this.phoneCallBtn = document.getElementById('btn-call-mark');
      this.phoneRowMomEl = document.getElementById('phone-row-mom');
      this.phoneMomStatusEl = document.getElementById('phone-mom-status');
      this.phoneCallMomBtn = document.getElementById('btn-call-mom');
      this.phoneNoServiceBanner = document.getElementById('phone-noservice-banner');
      this.phoneWaveEl = document.getElementById('phone-audio-wave');
      this.vignetteLayerEl = document.getElementById('vignette-layer');

      // Menu Pause [ESC] Elements
      this.pauseOverlayEl = document.getElementById('pause-menu-overlay');
      this.btnPauseResume = document.getElementById('btn-pause-resume');
      this.btnPauseSettings = document.getElementById('btn-pause-settings');
      this.btnPauseQuit = document.getElementById('btn-pause-quit');
      this.pauseSettingsDrawer = document.getElementById('pause-settings-drawer');
      this.pauseQuitConfirmBox = document.getElementById('pause-quit-confirm-box');
      this.btnPauseQuitCancel = document.getElementById('btn-pause-quit-cancel');
      this.btnPauseQuitConfirm = document.getElementById('btn-pause-quit-confirm');

      this.pauseSliderMaster = document.getElementById('pause-slider-master');
      this.pauseLabelMaster = document.getElementById('pause-label-master');
      this.pauseSliderSfx = document.getElementById('pause-slider-sfx');
      this.pauseLabelSfx = document.getElementById('pause-label-sfx');
      this.pauseSliderSens = document.getElementById('pause-slider-sens');
      this.pauseLabelSens = document.getElementById('pause-label-sens');

      if (this.phoneRowMomEl) {
        this.phoneRowMomEl.classList.remove('mom-highlight');
      }
      if (this.phoneMomStatusEl) {
        this.phoneMomStatusEl.textContent = 'TERKUNCI // TIDAK ADA RESPON';
        this.phoneMomStatusEl.style.color = '#64748b';
      }
    }

    init() {
      if (!this.canvas) return;
      this.canvas.style.display = 'block';

      if (typeof window.THREE === 'undefined') {
        console.error('Three.js belum dimuat.');
        return;
      }

      this._initThreeSceneAndRenderer();
      this._buildBedroomGeometry();
      this._buildLShapedHallwayAndProps();
      this._initLightingAndFlashlight();
      this._initEventListeners();
      this._initPauseMenuControls();
      this._initSmartphoneClock();

      this.setObjective('Periksa lingkungan kamar dan ambil ponselmu di dekat tempat tidur');
      this._updateEquipmentHUD();

      const THREE = window.THREE;
      this.clock = new THREE.Clock();
      let totalUnpausedElapsed = 0;

      const animate = () => {
        if (this.isDisposed) return;
        this.rafId = requestAnimationFrame(animate);
        try {
          const rawDelta = Math.min(this.clock ? this.clock.getDelta() : 0.016, 0.1);
          if (!this.isPaused) {
            totalUnpausedElapsed += rawDelta;
            this._tickPauseAwareTimers(rawDelta);
            this._update(rawDelta, totalUnpausedElapsed);
          }
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        } catch (frameErr) {
          console.warn('Frame render warning:', frameErr);
        }
      };
      this.rafId = requestAnimationFrame(animate);

      this.setPauseAwareTimeout(() => {
        if (!this.isDisposed) {
          this.startOpeningMonologue();
        }
      }, 600);
    }

    /**
     * 3. Sistem Menu Pause [ESC] (Diegetic / Clean Horror Pause UI)
     */
    _initPauseMenuControls() {
      this._syncPauseSliders();

      if (this.btnPauseResume) {
        this.btnPauseResume.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setPaused(false, true);
        });
      }

      if (this.btnPauseSettings) {
        this.btnPauseSettings.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.pauseQuitConfirmBox) this.pauseQuitConfirmBox.classList.remove('open');
          if (this.pauseSettingsDrawer) {
            this.pauseSettingsDrawer.classList.toggle('open');
          }
        });
      }

      if (this.btnPauseQuit) {
        this.btnPauseQuit.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.pauseSettingsDrawer) this.pauseSettingsDrawer.classList.remove('open');
          if (this.pauseQuitConfirmBox) {
            this.pauseQuitConfirmBox.classList.toggle('open');
          }
        });
      }

      if (this.btnPauseQuitCancel) {
        this.btnPauseQuitCancel.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.pauseQuitConfirmBox) this.pauseQuitConfirmBox.classList.remove('open');
        });
      }

      if (this.btnPauseQuitConfirm) {
        this.btnPauseQuitConfirm.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setPaused(false, false);
          const exitBtn = document.getElementById('btn-exit-to-menu');
          if (exitBtn) {
            exitBtn.click();
          } else {
            window.location.reload();
          }
        });
      }

      if (this.pauseSliderMaster) {
        this.pauseSliderMaster.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          this.settings.masterVolume = val;
          if (this.pauseLabelMaster) this.pauseLabelMaster.textContent = `${val}%`;
          this.voAudio.volume = this._getEffectiveVolume();
          this._saveSettingsToStorage();
        });
      }

      if (this.pauseSliderSfx) {
        this.pauseSliderSfx.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          this.settings.sfxVolume = val;
          if (this.pauseLabelSfx) this.pauseLabelSfx.textContent = `${val}%`;
          this.voAudio.volume = this._getEffectiveVolume();
          this._saveSettingsToStorage();
        });
      }

      if (this.pauseSliderSens) {
        this.pauseSliderSens.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          this.settings.mouseSensitivity = val;
          if (this.pauseLabelSens) this.pauseLabelSens.textContent = `${val.toFixed(1)}x`;
          this._saveSettingsToStorage();
        });
      }
    }

    _syncPauseSliders() {
      if (this.pauseSliderMaster) this.pauseSliderMaster.value = this.settings.masterVolume;
      if (this.pauseLabelMaster) this.pauseLabelMaster.textContent = `${this.settings.masterVolume}%`;
      if (this.pauseSliderSfx) this.pauseSliderSfx.value = this.settings.sfxVolume;
      if (this.pauseLabelSfx) this.pauseLabelSfx.textContent = `${this.settings.sfxVolume}%`;
      if (this.pauseSliderSens) this.pauseSliderSens.value = Number(this.settings.mouseSensitivity).toFixed(1);
      if (this.pauseLabelSens) this.pauseLabelSens.textContent = `${Number(this.settings.mouseSensitivity).toFixed(1)}x`;
    }

    _lockPointer() {
      if (this.isDisposed || this.isPaused) return;
      try {
        const targetEl = this.canvas || document.body;
        if (targetEl && typeof targetEl.requestPointerLock === 'function' && !document.pointerLockElement) {
          const lockPromise = targetEl.requestPointerLock();
          if (lockPromise && typeof lockPromise.catch === 'function') {
            lockPromise.catch(() => {});
          }
        }
      } catch (_) {}
    }

    _unlockPointer() {
      try {
        if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
          document.exitPointerLock();
        }
      } catch (_) {}
    }

    setPaused(pauseState, requestLockOnResume = false) {
      if (this.isDisposed) return;
      this.isPaused = Boolean(pauseState);

      if (this.isPaused) {
        // Reset input gerak agar karakter tidak jalan sendiri saat jeda
        this.moveInput.forward = false;
        this.moveInput.backward = false;
        this.moveInput.left = false;
        this.moveInput.right = false;

        // Lepaskan Pointer Lock secara otomatis
        if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
          try {
            document.exitPointerLock();
          } catch (_) {}
        }

        // Pause audio VO sementara jika sedang berputar
        if (this.voAudio && !this.voAudio.paused) {
          this.wasVoPlayingBeforePause = true;
          try { this.voAudio.pause(); } catch (_) {}
        } else {
          this.wasVoPlayingBeforePause = false;
        }

        this._syncPauseSliders();
        if (this.pauseOverlayEl) {
          this.pauseOverlayEl.classList.add('open');
          this.pauseOverlayEl.setAttribute('aria-hidden', 'false');
        }
      } else {
        if (this.pauseOverlayEl) {
          this.pauseOverlayEl.classList.remove('open');
          this.pauseOverlayEl.setAttribute('aria-hidden', 'true');
        }
        if (this.pauseSettingsDrawer) this.pauseSettingsDrawer.classList.remove('open');
        if (this.pauseQuitConfirmBox) this.pauseQuitConfirmBox.classList.remove('open');

        if (this.wasVoPlayingBeforePause && this.voAudio) {
          this.wasVoPlayingBeforePause = false;
          try { this.voAudio.play().catch(() => {}); } catch (_) {}
        }

        if (requestLockOnResume && document.body && typeof document.body.requestPointerLock === 'function') {
          try {
            const p = document.body.requestPointerLock();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          } catch (_) {}
        }
      }
    }

    _initThreeSceneAndRenderer() {
      const THREE = window.THREE;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x05060a);
      this.scene.fog = new THREE.Fog(0x05060a, 2, 19);

      this.camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        60
      );
      this.camera.position.set(0, 1.6, 2.0);
      this.camera.rotation.order = 'YXZ';
      this.scene.add(this.camera);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      const pixelRatioCap = this.settings.graphicsQuality === 'Low' ? 1.0
        : this.settings.graphicsQuality === 'Medium' ? 1.35 : Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(pixelRatioCap);

      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.raycaster = new THREE.Raycaster();
      this.raycaster.far = 3.0;
      this.centerScreenNDC = new THREE.Vector2(0, 0);
    }

    _createProceduralTexture(type) {
      const THREE = window.THREE;
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      if (type === 'wood_floor') {
        ctx.fillStyle = '#241913';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 8; i++) {
          ctx.strokeStyle = '#140d09';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, i * 32, 256, 32);
        }
        for (let i = 0; i < 600; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15,10,7,0.22)' : 'rgba(65,45,32,0.12)';
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 18 + Math.random() * 35, 1.5);
        }
      } else if (type === 'wall_plaster') {
        ctx.fillStyle = '#2d3034';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1200; i++) {
          const v = 32 + Math.floor(Math.random() * 24);
          ctx.fillStyle = `rgba(${v},${v + 2},${v + 4},0.22)`;
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
        }
      } else if (type === 'dark_wood') {
        ctx.fillStyle = '#2e1d14';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 450; i++) {
          ctx.fillStyle = 'rgba(18, 10, 6, 0.25)';
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 4, 24);
        }
      } else if (type === 'mossy_hallway_wall') {
        ctx.fillStyle = '#484a50';
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 900; i++) {
          const g = 58 + Math.floor(Math.random() * 28);
          ctx.fillStyle = `rgba(${g},${g + 2},${g + 5},0.25)`;
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 4, 4);
        }
        ctx.fillStyle = '#25272c';
        ctx.fillRect(0, 148, 256, 8);
        for (let i = 0; i < 24; i++) {
          const sx = Math.random() * 256;
          const sy = Math.random() * 120;
          const grad = ctx.createLinearGradient(sx, sy, sx, sy + 110);
          grad.addColorStop(0, 'rgba(22, 28, 24, 0.42)');
          grad.addColorStop(0.5, 'rgba(18, 24, 20, 0.28)');
          grad.addColorStop(1, 'rgba(14, 18, 16, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(sx, sy, 6 + Math.random() * 14, 110);
        }
      } else if (type === 'cracked_hallway_tiles') {
        ctx.fillStyle = '#26292e';
        ctx.fillRect(0, 0, 256, 256);
        const tileSize = 64;
        for (let gx = 0; gx < 4; gx++) {
          for (let gy = 0; gy < 4; gy++) {
            const shade = 58 + Math.floor(Math.random() * 18);
            ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
            ctx.fillRect(gx * tileSize + 2, gy * tileSize + 2, tileSize - 4, tileSize - 4);
            if (Math.random() > 0.35) {
              ctx.strokeStyle = '#090a0c';
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              const startX = gx * tileSize + Math.random() * tileSize;
              const startY = gy * tileSize + Math.random() * tileSize;
              ctx.moveTo(startX, startY);
              ctx.lineTo(startX + (Math.random() - 0.5) * 38, startY + (Math.random() - 0.5) * 38);
              ctx.lineTo(startX + (Math.random() - 0.5) * 52, startY + (Math.random() - 0.5) * 52);
              ctx.stroke();
            }
          }
        }
      } else if (type === 'smashed_phone_screen') {
        ctx.fillStyle = '#0c1824';
        ctx.fillRect(0, 0, 256, 256);
        const glow = ctx.createRadialGradient(110, 120, 10, 128, 128, 130);
        glow.addColorStop(0, 'rgba(165, 220, 245, 0.92)');
        glow.addColorStop(0.45, 'rgba(65, 130, 165, 0.55)');
        glow.addColorStop(1, 'rgba(10, 18, 26, 0.95)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = 'rgba(125, 8, 8, 0.86)';
        ctx.beginPath();
        ctx.arc(175, 92, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(75, 4, 4, 0.92)';
        ctx.beginPath();
        ctx.arc(155, 118, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#040608';
        ctx.lineWidth = 2.2;
        const impactX = 115;
        const impactY = 110;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
          ctx.beginPath();
          ctx.moveTo(impactX, impactY);
          const midX = impactX + Math.cos(a) * 65 + (Math.random() - 0.5) * 14;
          const midY = impactY + Math.sin(a) * 65 + (Math.random() - 0.5) * 14;
          ctx.lineTo(midX, midY);
          ctx.lineTo(impactX + Math.cos(a + 0.08) * 150, impactY + Math.sin(a + 0.08) * 150);
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    _buildBedroomGeometry() {
      const THREE = window.THREE;
      this.rootThreeScene = this.scene;
      this.floorThreeBedroomGroup = new THREE.Group();
      this.rootThreeScene.add(this.floorThreeBedroomGroup);
      this.scene = this.floorThreeBedroomGroup;

      const floorTex = this._createProceduralTexture('wood_floor');
      floorTex.repeat.set(4, 4);

      const wallTex = this._createProceduralTexture('wall_plaster');
      wallTex.repeat.set(3, 1.5);

      const woodTex = this._createProceduralTexture('dark_wood');

      const floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x222428,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const wallMat = new THREE.MeshStandardMaterial({
        map: wallTex,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1
      });

      const darkWoodMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x3c261a,
        roughness: 0.84,
        metalness: 0.08
      });

      this._sharedMaterials = { floorMat, ceilingMat, wallMat, darkWoodMat, woodTex };

      const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      this.scene.add(floorMesh);

      const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ceilingMat);
      ceilingMesh.rotation.x = Math.PI / 2;
      ceilingMesh.position.y = 3.0;
      ceilingMesh.receiveShadow = true;
      this.scene.add(ceilingMesh);

      const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.15), wallMat);
      backWall.position.set(0, 1.5, 3.0);
      backWall.receiveShadow = true;
      this.scene.add(backWall);

      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 6), wallMat);
      leftWall.position.set(-3.0, 1.5, 0);
      leftWall.receiveShadow = true;
      this.scene.add(leftWall);

      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3, 6), wallMat);
      rightWall.position.set(3.0, 1.5, 0);
      rightWall.receiveShadow = true;
      this.scene.add(rightWall);

      const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.18), wallMat);
      frontWallLeft.position.set(-1.75, 1.5, -3.0);
      frontWallLeft.receiveShadow = true;
      this.scene.add(frontWallLeft);

      const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 0.18), wallMat);
      frontWallRight.position.set(1.75, 1.5, -3.0);
      frontWallRight.receiveShadow = true;
      this.scene.add(frontWallRight);

      const frontWallHeader = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.18), wallMat);
      frontWallHeader.position.set(0, 2.575, -3.0);
      frontWallHeader.receiveShadow = true;
      this.scene.add(frontWallHeader);

      const jambLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), darkWoodMat);
      jambLeft.position.set(-0.5, 1.09, -3.0);
      this.scene.add(jambLeft);

      const jambRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.18, 0.22), darkWoodMat);
      jambRight.position.set(0.5, 1.09, -3.0);
      this.scene.add(jambRight);

      const jambTop = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.08, 0.22), darkWoodMat);
      jambTop.position.set(0, 2.16, -3.0);
      this.scene.add(jambTop);

      // Daun Pintu Kamar Berengsel Interaktif (isLocked = true default)
      this.doorPivot = new THREE.Group();
      this.doorPivot.position.set(-0.46, 0, -2.95);
      this.scene.add(this.doorPivot);

      const doorMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        color: 0x45291c,
        roughness: 0.8,
        metalness: 0.1
      });
      this.doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.12, 0.06), doorMat);
      this.doorMesh.position.set(0.46, 1.06, 0);
      this.doorMesh.castShadow = true;
      this.doorMesh.receiveShadow = true;
      this.doorMesh.userData = { interactableType: 'door' };
      this.doorPivot.add(this.doorMesh);

      const handleMat = new THREE.MeshStandardMaterial({
        color: 0x8c7853,
        roughness: 0.35,
        metalness: 0.85
      });
      const doorHandle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), handleMat);
      doorHandle.position.set(0.82, 1.0, 0.055);
      doorHandle.userData = { interactableType: 'door' };
      this.doorPivot.add(doorHandle);

      this.interactables.push(this.doorMesh, doorHandle);

      // Tempat Tidur (bed) di Sudut Kiri Belakang
      const bedGroup = new THREE.Group();
      bedGroup.position.set(-1.95, 0, 1.75);

      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.36, 2.2), darkWoodMat);
      bedFrame.position.set(0, 0.18, 0);
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      bedGroup.add(bedFrame);

      const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.05, 0.12), darkWoodMat);
      headboard.position.set(0, 0.525, 1.04);
      headboard.castShadow = true;
      headboard.receiveShadow = true;
      bedGroup.add(headboard);

      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(1.52, 0.22, 2.02),
        new THREE.MeshStandardMaterial({ color: 0x5c5856, roughness: 0.94 })
      );
      mattress.position.set(0, 0.45, -0.02);
      mattress.castShadow = true;
      mattress.receiveShadow = true;
      bedGroup.add(mattress);

      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.11, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x7a7674, roughness: 0.92 })
      );
      pillow.position.set(0, 0.6, 0.72);
      pillow.rotation.x = 0.12;
      pillow.castShadow = true;
      bedGroup.add(pillow);

      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(1.54, 0.24, 1.32),
        new THREE.MeshStandardMaterial({ color: 0x2d1c1e, roughness: 0.95 })
      );
      blanket.position.set(0, 0.46, -0.36);
      blanket.castShadow = true;
      bedGroup.add(blanket);

      this.scene.add(bedGroup);

      // Objek Ponsel Maya (playerPhoneMesh) di Tepi Tempat Tidur untuk Langkah 1 Quest-Locking
      this.playerPhoneMesh = new THREE.Group();
      this.playerPhoneMesh.position.set(-1.32, 0.59, 1.45);
      this.playerPhoneMesh.rotation.y = 0.35;

      const pBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.016, 0.21),
        new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.3, metalness: 0.8 })
      );
      pBody.userData = { interactableType: 'player_phone' };
      this.playerPhoneMesh.add(pBody);

      const pScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.096, 0.19),
        new THREE.MeshStandardMaterial({
          color: 0x88d4f5,
          emissive: 0x3898c8,
          emissiveIntensity: 0.95
        })
      );
      pScreen.rotation.x = -Math.PI / 2;
      pScreen.position.set(0, 0.009, 0);
      pScreen.userData = { interactableType: 'player_phone' };
      this.playerPhoneMesh.add(pScreen);

      const pHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.24, 0.38),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      pHitbox.userData = { interactableType: 'player_phone' };
      this.playerPhoneMesh.add(pHitbox);

      this.scene.add(this.playerPhoneMesh);
      this.interactables.push(pBody, pScreen, pHitbox);

      // Meja Belajar / Nakas (desk) di Sudut Kanan Depan
      const deskGroup = new THREE.Group();
      deskGroup.position.set(2.05, 0, -2.15);

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.07, 0.78), darkWoodMat);
      deskTop.position.set(0, 0.78, 0);
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      deskGroup.add(deskTop);

      const deskDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.72), darkWoodMat);
      deskDrawer.position.set(0.38, 0.63, 0);
      deskDrawer.castShadow = true;
      deskGroup.add(deskDrawer);

      const legGeo = new THREE.BoxGeometry(0.07, 0.76, 0.07);
      [
        [-0.6, 0.38, -0.32],
        [0.6, 0.38, -0.32],
        [-0.6, 0.38, 0.32],
        [0.6, 0.38, 0.32]
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, darkWoodMat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        leg.receiveShadow = true;
        deskGroup.add(leg);
      });

      this.scene.add(deskGroup);

      // Objek Kunci Kamar (keyMesh) di Atas Meja Belajar
      this.keyMesh = new THREE.Group();
      this.keyMesh.position.set(1.85, 0.835, -2.05);
      this.keyMesh.rotation.y = 0.65;

      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: 0x3a2c08,
        emissiveIntensity: 0.45,
        roughness: 0.24,
        metalness: 0.92
      });

      const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12), brassMat);
      keyShaft.rotation.z = Math.PI / 2;
      keyShaft.castShadow = true;
      keyShaft.userData = { interactableType: 'key' };
      this.keyMesh.add(keyShaft);

      const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 18), brassMat);
      keyBow.rotation.x = Math.PI / 2;
      keyBow.position.set(-0.095, 0, 0);
      keyBow.castShadow = true;
      keyBow.userData = { interactableType: 'key' };
      this.keyMesh.add(keyBow);

      const keyBit = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.01, 0.036), brassMat);
      keyBit.position.set(0.055, 0, 0.02);
      keyBit.castShadow = true;
      keyBit.userData = { interactableType: 'key' };
      this.keyMesh.add(keyBit);

      const keyHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.18, 0.28),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      keyHitbox.userData = { interactableType: 'key' };
      this.keyMesh.add(keyHitbox);

      this.scene.add(this.keyMesh);
      this.interactables.push(keyShaft, keyBow, keyBit, keyHitbox);

      // Lemari Pakaian Tua (wardrobe)
      const wardrobeGroup = new THREE.Group();
      wardrobeGroup.position.set(2.52, 0, 0.7);

      const wardrobeBody = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.25, 1.45), darkWoodMat);
      wardrobeBody.position.set(0, 1.125, 0);
      wardrobeBody.castShadow = true;
      wardrobeBody.receiveShadow = true;
      wardrobeGroup.add(wardrobeBody);

      const seamMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 2.1, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x090604 })
      );
      seamMesh.position.set(-0.395, 1.12, 0);
      wardrobeGroup.add(seamMesh);

      const wHandle1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), handleMat);
      wHandle1.position.set(-0.41, 1.1, -0.08);
      wardrobeGroup.add(wHandle1);

      const wHandle2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.03), handleMat);
      wHandle2.position.set(-0.41, 1.1, 0.08);
      wardrobeGroup.add(wHandle2);

      this.scene.add(wardrobeGroup);
    }

    _buildLShapedHallwayAndProps() {
      const THREE = window.THREE;
      const { ceilingMat, darkWoodMat } = this._sharedMaterials;

      const mossyWallTexMain = this._createProceduralTexture('mossy_hallway_wall');
      mossyWallTexMain.repeat.set(4, 1.2);
      const mossyWallMat = new THREE.MeshStandardMaterial({
        map: mossyWallTexMain,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1
      });

      const crackedTileTexMain = this._createProceduralTexture('cracked_hallway_tiles');
      crackedTileTexMain.repeat.set(3, 10);
      const crackedTileMat = new THREE.MeshStandardMaterial({
        map: crackedTileTexMain,
        color: 0x2d3036,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide
      });

      const hall1Floor = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 12.4), crackedTileMat);
      hall1Floor.position.set(0, -0.05, -9.0);
      hall1Floor.receiveShadow = true;
      this.scene.add(hall1Floor);

      const hall1Ceiling = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 12.4), ceilingMat);
      hall1Ceiling.position.set(0, 3.05, -9.0);
      this.scene.add(hall1Ceiling);

      const hall1LeftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.08, 12.3), mossyWallMat);
      hall1LeftWall.position.set(-1.4, 1.5, -9.0);
      hall1LeftWall.receiveShadow = true;
      this.scene.add(hall1LeftWall);

      const hall1RightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.08, 9.4), mossyWallMat);
      hall1RightWall.position.set(1.4, 1.5, -7.58);
      hall1RightWall.receiveShadow = true;
      this.scene.add(hall1RightWall);

      const westNorthCapWall = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.08, 0.18), mossyWallMat);
      westNorthCapWall.position.set(0, 1.5, -15.0);
      westNorthCapWall.receiveShadow = true;
      this.scene.add(westNorthCapWall);

      if (window.Blindspot && window.Blindspot.FloorThreeExpansion) {
        this.scene = this.rootThreeScene || this.scene;
        this.floorExpansion = new window.Blindspot.FloorThreeExpansion(this);
        this.scene = this.floorThreeBedroomGroup || this.scene;
        this.floorExpansion.buildExpansionMap({
          mossyWallMat,
          crackedTileMat,
          mossyWallTex: mossyWallTexMain,
          crackedTileTex: crackedTileTexMain,
          woodTex: this._sharedMaterials.woodTex,
          ceilingMat,
          darkWoodMat
        });
      }

      const sealedDoorConfigs = [
        { x: -1.31, z: -6.5, rotY: Math.PI / 2, label: 'Kamar 301' },
        { x: 1.31, z: -7.8, rotY: -Math.PI / 2, label: 'Kamar 303' }
      ];

      sealedDoorConfigs.forEach((cfg) => {
        const doorGroup = new THREE.Group();
        doorGroup.position.set(cfg.x, 0, cfg.z);
        doorGroup.rotation.y = cfg.rotY;

        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.04, 2.18, 0.08), darkWoodMat);
        frame.position.set(0, 1.09, 0);
        doorGroup.add(frame);

        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.92, 2.1, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x2b1b12, roughness: 0.88 })
        );
        panel.position.set(0, 1.06, 0.02);
        panel.castShadow = true;
        panel.receiveShadow = true;
        panel.userData = { interactableType: 'sealed_door', roomLabel: cfg.label };
        doorGroup.add(panel);

        this.scene.add(doorGroup);
        this.interactables.push(panel);
      });

      // Ponsel Mark yang Hancur di Lorong
      this.markPhonePosition = new THREE.Vector3(0.18, 0.022, -11.0);
      this.markPhoneMesh = new THREE.Group();
      this.markPhoneMesh.position.copy(this.markPhonePosition);
      this.markPhoneMesh.rotation.y = -0.42;

      const phoneBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.016, 0.21),
        new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.4, metalness: 0.7 })
      );
      phoneBody.castShadow = true;
      phoneBody.userData = { interactableType: 'mark_phone' };
      this.markPhoneMesh.add(phoneBody);

      const smashedScreenTex = this._createProceduralTexture('smashed_phone_screen');
      this.markPhoneScreenMat = new THREE.MeshStandardMaterial({
        map: smashedScreenTex,
        emissive: 0x5599bb,
        emissiveMap: smashedScreenTex,
        emissiveIntensity: 1.35,
        roughness: 0.35
      });
      const phoneScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.098, 0.192),
        this.markPhoneScreenMat
      );
      phoneScreen.rotation.x = -Math.PI / 2;
      phoneScreen.position.set(0, 0.009, 0);
      phoneScreen.userData = { interactableType: 'mark_phone' };
      this.markPhoneMesh.add(phoneScreen);

      const phoneHitbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.24, 0.42),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      phoneHitbox.userData = { interactableType: 'mark_phone' };
      this.markPhoneMesh.add(phoneHitbox);

      this.markPhoneLight = new THREE.PointLight(0x66bbee, 0.65, 2.6, 1.8);
      this.markPhoneLight.position.set(0, 0.14, 0);
      this.markPhoneMesh.add(this.markPhoneLight);

      this.scene.add(this.markPhoneMesh);
      this.interactables.push(phoneBody, phoneScreen, phoneHitbox);

      // Wujud Baru Entitas untuk Corner Dart Jumpscare (Bayangan Hitam Pekat + Mata Merah Menyala)
      if (window.Blindspot && typeof window.Blindspot.createShadowRedEyesEntity === 'function') {
        this.shadowEntityMesh = window.Blindspot.createShadowRedEyesEntity(THREE);
      } else {
        this.shadowEntityMesh = new THREE.Group();
      }
      this.shadowEntityMesh.position.set(-1.15, 0, -13.6);
      this.shadowEntityMesh.visible = false;
      this.scene.add(this.shadowEntityMesh);
      this.scene = this.rootThreeScene || this.scene;
    }

    _initLightingAndFlashlight() {
      const THREE = window.THREE;

      const hemiLight = new THREE.HemisphereLight(0x1a202c, 0x050508, 0.22);
      this.hemiLight = hemiLight;
      this.scene.add(hemiLight);

      this.ambientLight = new THREE.AmbientLight(0x0e121a, 0.2);
      this.scene.add(this.ambientLight);

      this.ceilingLight = new THREE.PointLight(0xffeedd, this.baseCeilingIntensity, 14.0, 2);
      this.ceilingLight.position.set(0, 2.82, 0);
      this.ceilingLight.castShadow = true;
      const shadowRes = this.settings.graphicsQuality === 'Low' ? 512
        : this.settings.graphicsQuality === 'Medium' ? 1024 : 2048;
      this.ceilingLight.shadow.mapSize.width = shadowRes;
      this.ceilingLight.shadow.mapSize.height = shadowRes;
      this.ceilingLight.shadow.bias = -0.001;
      this.ceilingLight.shadow.normalBias = 0.02;
      this.ceilingLight.shadow.camera.near = 0.1;
      this.ceilingLight.shadow.camera.far = 25;
      this.scene.add(this.ceilingLight);

      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeedd });
      this.ceilingBulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), bulbMat);
      this.ceilingBulbMesh.position.set(0, 2.93, 0);
      this.scene.add(this.ceilingBulbMesh);

      this.hallwayNeonLight = new THREE.PointLight(0xd6e8f5, 1.25, 15.0, 2);
      this.hallwayNeonLight.position.set(0, 2.82, -8.5);
      this.scene.add(this.hallwayNeonLight);

      this.hallwayNeonTubeMat = new THREE.MeshBasicMaterial({ color: 0xcbe4f5 });
      this.hallwayNeonTubeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.04, 0.95),
        this.hallwayNeonTubeMat
      );
      this.hallwayNeonTubeMesh.position.set(0, 2.96, -8.5);
      this.scene.add(this.hallwayNeonTubeMesh);

      this.cornerEmergencyLight = new THREE.PointLight(0x881111, 1.45, 15.0, 2);
      this.cornerEmergencyLight.position.set(-1.12, 2.42, -13.6);
      this.scene.add(this.cornerEmergencyLight);

      const emergencyFixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.14, 0.26),
        new THREE.MeshBasicMaterial({ color: 0xaa1111 })
      );
      emergencyFixture.position.set(-1.31, 2.42, -13.6);
      this.scene.add(emergencyFixture);

      // Senter ([Tombol F] Flashlight) tajam & kontras tinggi (intensitas 2.4, penumbra 0.4)
      this.flashlight = new THREE.SpotLight(0xfff3d1, 2.4, 15, Math.PI / 5.5, 0.4, 1.3);
      this.flashlight.position.set(0, 0, 0);
      this.flashlight.target.position.set(0, 0, -5);
      this.flashlight.castShadow = true;
      this.flashlight.shadow.mapSize.width = 1024;
      this.flashlight.shadow.mapSize.height = 1024;
      this.flashlight.shadow.bias = -0.001;
      this.flashlight.shadow.normalBias = 0.02;
      this.flashlight.shadow.camera.near = 0.1;
      this.flashlight.shadow.camera.far = 25;
      this.flashlight.visible = false;

      this.camera.add(this.flashlight);
      this.camera.add(this.flashlight.target);
    }

    _updateLightsAndFlicker(delta, elapsed) {
      if (this.ambientLight) {
        this.ambientLight.color.setHex(0x0e121a);
        this.ambientLight.intensity = 0.2;
      }

      if (this.ceilingLight) {
        this.flickerState.timer += delta;
        if (this.flickerState.mode === 'normal') {
          this.ceilingLight.intensity = this.baseCeilingIntensity + (Math.random() - 0.5) * 0.06;
          if (this.ceilingBulbMesh) this.ceilingBulbMesh.material.color.setHex(0xffeedd);

          if (this.flickerState.timer >= this.flickerState.nextEventIn) {
            this.flickerState.timer = 0;
            if (Math.random() < 0.22) {
              this.flickerState.mode = 'blackout';
              this.flickerState.duration = 1.0 + Math.random() * 1.0;
              this.ceilingLight.intensity = 0;
              if (this.ceilingBulbMesh) this.ceilingBulbMesh.material.color.setHex(0x111114);
            } else {
              this.flickerState.mode = 'stutter';
              this.flickerState.duration = 0.08 + Math.random() * 0.18;
            }
          }
        } else if (this.flickerState.mode === 'stutter') {
          const dropVal = 0.1 + Math.random() * 0.3;
          this.ceilingLight.intensity = Math.random() > 0.35 ? dropVal : this.baseCeilingIntensity;
          if (this.ceilingBulbMesh) {
            this.ceilingBulbMesh.material.color.setHex(
              this.ceilingLight.intensity < 0.5 ? 0x44392e : 0xffeedd
            );
          }
          if (this.flickerState.timer >= this.flickerState.duration) {
            this.flickerState.mode = 'normal';
            this.flickerState.timer = 0;
            this.flickerState.nextEventIn = 0.9 + Math.random() * 2.8;
            this.ceilingLight.intensity = this.baseCeilingIntensity;
          }
        } else if (this.flickerState.mode === 'blackout') {
          this.ceilingLight.intensity = 0;
          if (this.flickerState.timer >= this.flickerState.duration) {
            this.flickerState.mode = 'normal';
            this.flickerState.timer = 0;
            this.flickerState.nextEventIn = 3.5 + Math.random() * 4.5;
            this.ceilingLight.intensity = this.baseCeilingIntensity;
            if (this.ceilingBulbMesh) this.ceilingBulbMesh.material.color.setHex(0xffeedd);
          }
        }
      }

      if (this.hallwayNeonLight && !this.hallwayNeonBlown) {
        const neonPulse = Math.sin(elapsed * 19.0) * Math.cos(elapsed * 7.3);
        const stutter = Math.random() > 0.92 ? 0.08 : 0.72 + neonPulse * 0.22;
        this.hallwayNeonLight.intensity = Math.max(0.05, stutter);
        if (this.hallwayNeonTubeMat) {
          this.hallwayNeonTubeMat.color.setHex(stutter < 0.2 ? 0x243038 : 0xcbe4f5);
        }
      }

      if (this.markPhoneLight && this.markPhoneScreenMat) {
        const screenFlicker = Math.random() > 0.88
          ? 0.18
          : 0.55 + Math.sin(elapsed * 11.0) * 0.2;
        this.markPhoneLight.intensity = screenFlicker;
        this.markPhoneScreenMat.emissiveIntensity = screenFlicker * 2.1;
      }
    }

    _checkHallwayProgressionAndJumpscare() {
      if (!this.camera) return;

      if (!this.hasEnteredHallway && this.camera.position.z < -3.2) {
        this.hasEnteredHallway = true;
        this.setObjective('Periksa ponsel Mark yang terjatuh di lorong.');
      }

      if (!this.hasTriggeredCornerJumpscare && this.markPhonePosition) {
        const dx = this.camera.position.x - this.markPhonePosition.x;
        const dz = this.camera.position.z - this.markPhonePosition.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 2.5) {
          this._triggerCornerDartJumpscare();
        }
      }
    }

    _triggerCornerDartJumpscare() {
      if (this.hasTriggeredCornerJumpscare || this.isDisposed) return;
      this.hasTriggeredCornerJumpscare = true;

      this.cameraShakeDuration = 0.72;
      this.cameraShakeTimer = 0;
      this.cameraShakeIntensity = 0.055;

      this.hallwayNeonBlown = true;
      if (this.hallwayNeonLight) {
        this.hallwayNeonLight.intensity = 3.2;
        this.setPauseAwareTimeout(() => {
          if (this.hallwayNeonLight) this.hallwayNeonLight.intensity = 0;
          if (this.hallwayNeonTubeMat) this.hallwayNeonTubeMat.color.setHex(0x090a0c);
        }, 95);
      }

      if (this.shadowEntityMesh) {
        this.shadowEntityMesh.position.set(-1.15, 0, -13.6);
        this.shadowEntityMesh.visible = true;
        this.isShadowDartAnimating = true;
        this.shadowDartStartTime = performance.now();
      }

      this.playOneShotSfx('assets/audio/sfx_jumpscare_impact.mp3');
      this.playOneShotSfx('assets/audio/sfx_maya_gasp.mp3');
      this._startFastHeartbeatLoop(6000);

      if (this.phoneStatusEl) {
        this.phoneStatusEl.textContent = 'PONSEL HANCUR // OFFLINE';
        this.phoneStatusEl.className = 'phone-contact-sub';
      }
      if (this.phoneCallBtn) {
        this.phoneCallBtn.disabled = true;
        this.phoneCallBtn.textContent = 'TIDAK DAPAT DIHUBUNGI';
      }

      this.setCommunicationActive(true);
      this.setPauseAwareTimeout(() => {
        if (this.isDisposed) return;
        this._runVoiceSequence(MAYA_HALLWAY_PANIC_SEQUENCE, 0, () => {
          this.setCommunicationActive(false);
          this._unlockMomContactState();
          this.setObjective('Buka ponselmu [TAB / H] dan hubungi Ibu untuk mencari bantuan.');
        });
      }, 1000);
    }

    _updateShadowDartAndCameraShake(delta, elapsed) {
      if (this.isShadowDartAnimating && this.shadowEntityMesh) {
        if (window.Blindspot && typeof window.Blindspot.updateShadowEntityVertices === 'function') {
          window.Blindspot.updateShadowEntityVertices(this.shadowEntityMesh, elapsed);
        }
        const elapsedSec = (performance.now() - this.shadowDartStartTime) / 1000;
        const t = Math.min(1, elapsedSec / this.shadowDartDuration);

        this.shadowEntityMesh.position.x = -1.15 + t * 4.8;
        this.shadowEntityMesh.position.y = Math.abs(Math.sin(t * Math.PI * 5)) * 0.08;

        if (t >= 1) {
          this.isShadowDartAnimating = false;
          this.shadowEntityMesh.visible = false;
        }
      }

      if (this.cameraShakeTimer < this.cameraShakeDuration && this.camera) {
        this.cameraShakeTimer += delta;
        const progress = this.cameraShakeTimer / this.cameraShakeDuration;
        const damp = Math.max(0, 1 - progress);
        const shakeX = (Math.random() - 0.5) * 2 * this.cameraShakeIntensity * damp;
        const shakeY = (Math.random() - 0.5) * 2 * this.cameraShakeIntensity * damp;
        const shakeZ = (Math.random() - 0.5) * 1.5 * this.cameraShakeIntensity * damp;

        this.camera.rotation.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.pitch + shakeX));
        this.camera.rotation.y = this.yaw + shakeY;
        this.camera.rotation.z = shakeZ;
      } else if (this.isWhisperTerrorActive && this.camera) {
        const microX = (Math.random() - 0.5) * 0.0085;
        const microY = (Math.random() - 0.5) * 0.0085;
        const microZ = (Math.random() - 0.5) * 0.006;
        this.camera.rotation.x = Math.max(-Math.PI / 2.15, Math.min(Math.PI / 2.15, this.pitch + microX));
        this.camera.rotation.y = this.yaw + microY;
        this.camera.rotation.z = microZ;
      } else if (this.camera && this.camera.rotation.z !== 0) {
        this.camera.rotation.z = 0;
        this.camera.rotation.x = this.pitch;
        this.camera.rotation.y = this.yaw;
      }
    }

    _startFastHeartbeatLoop(durationMs = 6000) {
      const vol = this._getEffectiveVolume();
      if (vol <= 0.001) return;

      if (this.heartbeatAudio) {
        try { this.heartbeatAudio.pause(); } catch (_) {}
      }

      try {
        const hb = new Audio();
        hb.loop = true;
        hb.volume = vol;
        hb.src = 'assets/audio/sfx_heartbeat_fast.mp3';

        const p = hb.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            try {
              hb.src = 'sfx_heartbeat_fast.mp3';
              const p2 = hb.play();
              if (p2 && typeof p2.catch === 'function') p2.catch(() => {});
            } catch (_) {}
          });
        }
        this.heartbeatAudio = hb;
      } catch (_) {}

      this.setPauseAwareTimeout(() => {
        if (this.heartbeatAudio) {
          try {
            this.heartbeatAudio.pause();
            this.heartbeatAudio.currentTime = 0;
          } catch (_) {}
        }
      }, durationMs);
    }

    toggleFlashlight() {
      if (!this.flashlight) return;
      this.flashlightOn = !this.flashlightOn;
      this.flashlight.visible = this.flashlightOn;
      this._updateEquipmentHUD();
      this._playProceduralClickSfx(this.flashlightOn ? 520 : 340);
    }

    /**
     * Buka/Tutup Smartphone ([TAB / H]) — Diblokir saat Maya sedang bicara (isMayaSpeaking === true)
     */
    /**
     * Buka/Tutup Smartphone ([TAB / H]) — Terkunci total selama `isCommunicationActive === true`
     */
    toggleSmartphone(forceState) {
      if (!this.smartphoneEl) return;

      // Kunci pembukaan/penutupan manual layar ponsel selama ada komunikasi aktif (kecuali penutupan otomatis sistem forceState === false)
      if ((isCommunicationActive || this.isCommunicationActive) && forceState !== false) {
        return;
      }

      // Jika di kamar awal pemain menekan [TAB]/[H] setelah monolog pembuka selesai, tandai ponsel ditemukan
      if (!this.hasFoundPhone && forceState !== false) {
        this._pickupPlayerPhone(false);
      }

      this.isPhoneOpen = typeof forceState === 'boolean' ? forceState : !this.isPhoneOpen;

      if (this.isPhoneOpen) {
        this.smartphoneEl.classList.add('open');
        this.smartphoneEl.setAttribute('aria-hidden', 'false');

        if (
          this.momPhonePhaseUnlocked &&
          !this.hasPlayedPreMomMonologue &&
          !callFlags.momCallCompleted &&
          !this.isMomCallCompleted &&
          this.momCallState === 'idle'
        ) {
          this.startPreMomMonologue();
        }
      } else {
        this.smartphoneEl.classList.remove('open');
        this.smartphoneEl.setAttribute('aria-hidden', 'true');
      }
      this._playProceduralClickSfx(this.isPhoneOpen ? 680 : 420);
    }

    _pickupPlayerPhone(openImmediately = true) {
      if (this.hasFoundPhone) return;
      this.hasFoundPhone = true;
      if (this.playerPhoneMesh) {
        this.playerPhoneMesh.visible = false;
        this.scene.remove(this.playerPhoneMesh);
      }
      this._setInteractionPrompt('');
      this.setObjective('Hubungi Mark melalui ponselmu ([TAB / H] lalu klik Telepon Mark)');
      if (openImmediately && !this.isCommunicationActive) {
        this.toggleSmartphone(true);
      }
    }

    _unlockMomContactState() {
      this.momPhonePhaseUnlocked = true;
      if (this.phoneRowMomEl) {
        this.phoneRowMomEl.classList.add('mom-highlight');
      }
      if (this.phoneMomStatusEl && !callFlags.momCallCompleted) {
        this.phoneMomStatusEl.textContent = 'LUAR KOTA // 1 BAR';
        this.phoneMomStatusEl.style.color = '#f59e0b';
      }
    }

    startPreMomMonologue() {
      if (
        !this.momPhonePhaseUnlocked ||
        this.hasPlayedPreMomMonologue ||
        callFlags.momCallCompleted ||
        this.isMomCallCompleted ||
        this.momCallState !== 'idle' ||
        this.isCommunicationActive
      ) {
        return;
      }
      this.hasPlayedPreMomMonologue = true;
      this.isPreMomMonologuePlaying = true;

      // Kunci komunikasi selama Maya berbicara monolog pra-panggilan Ibu
      this.setCommunicationActive(true);
      this.showSubtitle(PRE_MOM_MONOLOGUE.speaker, PRE_MOM_MONOLOGUE.text, false);
      this._playAudioWithFallback(
        PRE_MOM_MONOLOGUE.file,
        PRE_MOM_MONOLOGUE.duration,
        () => {
          if (this.isDisposed || !this.isPreMomMonologuePlaying) return;
          this.isPreMomMonologuePlaying = false;
          this.hideSubtitle();
          // Buka kunci komunikasi tepat setelah monolog Maya tuntas agar panggilan Ibu dapat dimulai secara berurutan
          this.setCommunicationActive(false);

          this.setPauseAwareTimeout(() => {
            if (!this.isDisposed && !callFlags.momCallCompleted && this.momCallState === 'idle') {
              this.triggerCallMom();
            }
          }, PRE_MOM_MONOLOGUE.delayAfter);
        }
      );
    }

    /**
     * Panggilan Sekali Pakai ke Ibu (`callFlags.momCallCompleted`)
     * - Tidak dapat dipicu saat `isCommunicationActive === true` atau setelah `callFlags.momCallCompleted === true`.
     */
    triggerCallMom() {
      // Cegah tumpang tindih (overlap) dan panggilan berulang
      if (
        isCommunicationActive ||
        this.isCommunicationActive ||
        callFlags.momCallCompleted ||
        this.isMomCallCompleted ||
        this.momCallState !== 'idle'
      ) {
        return;
      }

      if (!this.momPhonePhaseUnlocked) {
        this._playProceduralClickSfx(115);
        if (this.phoneMomStatusEl) {
          this.phoneMomStatusEl.textContent = 'Tidak ada respon / Panggilan gagal';
          this.phoneMomStatusEl.style.color = '#ef4444';
        }
        return;
      }

      this.isPreMomMonologuePlaying = false;
      this.hasPlayedPreMomMonologue = true;

      if (!this.isPhoneOpen) {
        this.toggleSmartphone(true);
      }

      // Kunci kontak Ibu sebagai panggilan sekali pakai (One-Time Phone Call)
      this.momCallState = 'ringing';
      this.isPhoneCalling = true;
      this.isMomCallCompleted = true;
      callFlags.momCallCompleted = true;
      this.setCommunicationActive(true);

      if (this.phoneMomStatusEl) {
        this.phoneMomStatusEl.textContent = 'MEMANGGIL IBU... (1 BAR)';
        this.phoneMomStatusEl.style.color = '#f59e0b';
      }
      if (this.phoneCallMomBtn) {
        if (typeof this.phoneCallMomBtn.blur === 'function') this.phoneCallMomBtn.blur();
        this.phoneCallMomBtn.disabled = true;
        this.phoneCallMomBtn.textContent = 'MENYAMBUNGKAN KE IBU...';
      }
      this._lockPointer();

      this._playAudioWithFallback(
        'assets/audio/call_ring_glitch.mp3',
        3500,
        () => {
          if (this.isDisposed) return;
          this.momCallState = 'connected';
          if (this.phoneMomStatusEl) {
            this.phoneMomStatusEl.textContent = 'TERHUBUNG // SINYAL LEMAH';
            this.phoneMomStatusEl.style.color = '#4fd1c5';
          }
          if (this.phoneWaveEl) {
            this.phoneWaveEl.classList.add('active');
          }
          if (this.phoneCallMomBtn) {
            this.phoneCallMomBtn.textContent = 'PANGGILAN IBU AKTIF';
          }

          this._runVoiceSequence(MOM_PHONE_CALL_SEQUENCE, 0, () => {
            this._triggerMomCallCutNoService();
          });
        }
      );
    }

    _triggerMomCallCutNoService() {
      if (this.isDisposed) return;
      this.momCallState = 'no_service';
      this.isPhoneCalling = false;
      this.isMomCallCompleted = true;
      callFlags.momCallCompleted = true;

      if (this.phoneWaveEl) {
        this.phoneWaveEl.classList.remove('active');
      }
      if (this.phoneSignalEl) {
        this.phoneSignalEl.textContent = 'TIDAK ADA LAYANAN / NO SERVICE';
        this.phoneSignalEl.classList.add('no-service');
      }
      if (this.phoneMomStatusEl) {
        this.phoneMomStatusEl.textContent = 'PANGGILAN SELESAI // TERPUTUS';
        this.phoneMomStatusEl.style.color = '#ef4444';
      }
      if (this.phoneCallMomBtn) {
        this.phoneCallMomBtn.disabled = true;
        this.phoneCallMomBtn.textContent = 'NO SERVICE // TERKUNCI';
      }
      if (this.phoneNoServiceBanner) {
        this.phoneNoServiceBanner.classList.add('active');
      }

      this.setCommunicationActive(true);
      this.showSubtitle('SISTEM TELEPON', '[ PANGGILAN TERPUTUS - TIDAK ADA LAYANAN / NO SERVICE ]', true);

      this._playAudioWithFallback(
        'assets/audio/call_cut_nosignal.mp3',
        2800,
        () => {
          if (this.isDisposed) return;
          this.hideSubtitle();
          this._startPostMomDespairAndWhisperSequence();
        }
      );
    }

    _startPostMomDespairAndWhisperSequence() {
      this.toggleSmartphone(false);
      this.setCommunicationActive(true);

      this.showSubtitle(POST_MOM_DESPAIR_MONOLOGUE.speaker, POST_MOM_DESPAIR_MONOLOGUE.text, false);
      this._playAudioWithFallback(
        POST_MOM_DESPAIR_MONOLOGUE.file,
        POST_MOM_DESPAIR_MONOLOGUE.duration,
        () => {
          if (this.isDisposed) return;
          this.hideSubtitle();

          this.setPauseAwareTimeout(() => {
            if (!this.isDisposed) {
              this._triggerBlindspotWhisperEvent();
            }
          }, POST_MOM_DESPAIR_MONOLOGUE.delayAfter);
        }
      );
    }

    _triggerBlindspotWhisperEvent() {
      if (this.isDisposed) return;

      this.isWhisperTerrorActive = true;
      this.setCommunicationActive(true);
      if (this.vignetteLayerEl) {
        this.vignetteLayerEl.classList.add('whisper-terror-vignette');
      }

      this.showSubtitle('ENTITAS [DI TELINGAMU]', '[Hembusan napas dingin dan bisikan parau tepat di leher belakangmu...]', true);
      this._playAudioWithFallback(
        ENTITY_WHISPER_REACTION.whisperFile,
        ENTITY_WHISPER_REACTION.whisperDuration,
        () => {
          if (this.isDisposed) return;
          this.hideSubtitle();

          this.setPauseAwareTimeout(() => {
            if (this.isDisposed) return;
            this.showSubtitle(
              ENTITY_WHISPER_REACTION.speaker,
              ENTITY_WHISPER_REACTION.reactionText,
              false
            );
            this._playAudioWithFallback(
              ENTITY_WHISPER_REACTION.reactionFile,
              ENTITY_WHISPER_REACTION.reactionDuration,
              () => {
                if (this.isDisposed) return;
                this.hideSubtitle();
                this.isWhisperTerrorActive = false;
                // Setelah seluruh rangkaian panggilan Ibu & bisikan entitas tuntas, buka kembali akses interaksi lingkungan!
                this.setCommunicationActive(false);
                if (this.vignetteLayerEl) {
                  this.vignetteLayerEl.classList.remove('whisper-terror-vignette');
                }
                this.setObjective('Jelajahi lantai tiga dan temukan jalan keluar alternatif.');
              }
            );
          }, ENTITY_WHISPER_REACTION.whisperDelayAfter);
        }
      );
    }

    /**
     * Panggilan Sekali Pakai ke Mark di Kamar (`callFlags.markRoomCompleted`)
     * - Hanya bisa dipanggil SATU KALI setelah monolog pembuka Maya selesai (`!isCommunicationActive`).
     * - Setelah selesai, kontak Mark langsung dikunci permanen (`isMarkCallCompleted = true`, `disabled = true`).
     */
    triggerCallMark() {
      if (
        isCommunicationActive ||
        this.isCommunicationActive ||
        callFlags.markRoomCompleted ||
        this.isMarkCallCompleted ||
        this.phoneCallState !== 'idle'
      ) {
        return;
      }

      this.hasFoundPhone = true;
      if (this.playerPhoneMesh) {
        this.playerPhoneMesh.visible = false;
      }

      if (!this.isPhoneOpen) {
        this.toggleSmartphone(true);
      }

      // Kunci kontak Mark sebagai One-Time Call & aktifkan penguncian interaksi selama telepon berlangsung
      this.phoneCallState = 'ringing';
      this.isPhoneCalling = true;
      this.isMarkCallCompleted = true;
      callFlags.markRoomCompleted = true;
      this.setCommunicationActive(true);

      if (this.phoneStatusEl) {
        this.phoneStatusEl.textContent = 'MEMANGGIL MARK...';
        this.phoneStatusEl.className = 'phone-call-status ringing';
      }
      if (this.phoneCallBtn) {
        if (typeof this.phoneCallBtn.blur === 'function') this.phoneCallBtn.blur();
        this.phoneCallBtn.disabled = true;
        this.phoneCallBtn.textContent = 'MENYAMBUNGKAN...';
      }
      this._lockPointer();

      this._playAudioWithFallback(
        'assets/audio/call_ring.mp3',
        3500,
        () => {
          if (this.isDisposed) return;
          this.phoneCallState = 'connected';
          if (this.phoneStatusEl) {
            this.phoneStatusEl.textContent = 'TERHUBUNG // MARK (00:01)';
            this.phoneStatusEl.className = 'phone-call-status connected';
          }
          if (this.phoneWaveEl) {
            this.phoneWaveEl.classList.add('active');
          }
          if (this.phoneCallBtn) {
            this.phoneCallBtn.textContent = 'PANGGILAN BERLANGSUNG';
          }
          this._runVoiceSequence(PHONE_CALL_SEQUENCE, 0, () => {
            this._onMarkCallFinished();
          });
        }
      );
    }

    _onMarkCallFinished() {
      this.phoneCallState = 'ended';
      this.isPhoneCalling = false;
      this.talkedToMark = true;
      this.isMarkCallCompleted = true;
      callFlags.markRoomCompleted = true;

      if (this.phoneWaveEl) {
        this.phoneWaveEl.classList.remove('active');
      }
      if (this.phoneStatusEl) {
        this.phoneStatusEl.textContent = 'PANGGILAN SELESAI // TERPUTUS';
        this.phoneStatusEl.className = 'phone-call-status dropped';
      }
      // Aturan One-Time Phone Call: Kontak Mark langsung dikunci permanen, TIDAK BISA ditelepon ulang!
      if (this.phoneCallBtn) {
        this.phoneCallBtn.disabled = true;
        this.phoneCallBtn.textContent = 'PANGGILAN SELESAI // TERKUNCI';
      }

      // Tutup layar ponsel & buka kunci interaksi barang (kunci kamar & pintu kini dapat diakses!)
      this.toggleSmartphone(false);
      this.setCommunicationActive(false);

      if (!this.hasRoomKey) {
        this.setObjective('Ambil kunci cadangan di atas meja [E] dan buka pintu kamar');
      } else {
        this.setObjective('Buka pintu kamar tidur [E] untuk keluar ke lorong');
      }
    }

    startOpeningMonologue() {
      if (this.phoneCallState !== 'idle' || this.isCommunicationActive) return;
      this.setCommunicationActive(true);
      this._runVoiceSequence(OPENING_MONOLOGUE_SEQUENCE, 0, () => {
        if (this.isDisposed) return;
        this.setCommunicationActive(false);
        if (!this.hasFoundPhone) {
          this.setObjective('Ambil ponselmu di dekat tempat tidur [E] atau tekan [TAB / H]');
        } else if (!this.talkedToMark) {
          this.setObjective('Buka ponsel [TAB / H] dan hubungi Mark');
        }
      });
    }

    _runVoiceSequence(sequenceArray, index, onSequenceDone) {
      if (this.isDisposed) return;
      if (index >= sequenceArray.length) {
        this.hideSubtitle();
        this.setMayaSpeaking(false);
        if (typeof onSequenceDone === 'function') {
          onSequenceDone();
        }
        return;
      }

      const item = sequenceArray[index];
      this.setMayaSpeaking(true);
      this.showSubtitle(item.speaker, item.text, item.isCallDrop);

      if (item.timedSfx) {
        this.setPauseAwareTimeout(() => {
          if (!this.isDisposed) {
            this.playOneShotSfx(item.timedSfx.file);
          }
        }, item.timedSfx.triggerAtMs);
      }

      this._playAudioWithFallback(item.file, item.duration, () => {
        if (this.isDisposed) return;
        this.hideSubtitle();
        this.setPauseAwareTimeout(() => {
          this._runVoiceSequence(sequenceArray, index + 1, onSequenceDone);
        }, item.delayAfter || 600);
      });
    }

    _playAudioWithFallback(filePath, fallbackDurationMs, onComplete) {
      try {
        this.voAudio.pause();
      } catch (_) {}

      let finished = false;
      let watchdogTimerId = null;

      const finish = () => {
        if (finished || this.isDisposed) return;
        finished = true;
        if (watchdogTimerId) this.clearPauseAwareTimeout(watchdogTimerId);
        this.voAudio.onended = null;
        this.voAudio.onerror = null;
        if (typeof onComplete === 'function') {
          onComplete();
        }
      };

      const vol = this._getEffectiveVolume();
      this.voAudio.volume = vol;

      const flatPath = filePath.split('/').pop();
      let triedFlat = false;

      this.voAudio.onended = finish;
      this.voAudio.onerror = () => {
        if (!triedFlat && flatPath !== filePath) {
          triedFlat = true;
          this.voAudio.src = flatPath;
          this.voAudio.play().catch(() => {
            watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
          });
          return;
        }
        watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
      };

      try {
        this.voAudio.src = filePath;
        const p = this.voAudio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs + 350);
          }).catch(() => {
            if (!triedFlat && flatPath !== filePath) {
              triedFlat = true;
              this.voAudio.src = flatPath;
              this.voAudio.play().then(() => {
                watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs + 350);
              }).catch(() => {
                watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
              });
            } else {
              watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
            }
          });
        } else {
          watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
        }
      } catch (_) {
        watchdogTimerId = this.setPauseAwareTimeout(finish, fallbackDurationMs);
      }
    }

    playOneShotSfx(filePath) {
      try {
        const vol = this._getEffectiveVolume();
        if (vol <= 0.001) return;

        if (!Array.isArray(this.sfxAudioPool)) {
          this.sfxAudioPool = [];
        }
        while (this.sfxAudioPool.length > 20) {
          const oldest = this.sfxAudioPool.shift();
          if (oldest) {
            try {
              oldest.pause();
              oldest.src = '';
            } catch (_) {}
          }
        }

        const sfx = new Audio();
        sfx.volume = vol;
        const flatPath = filePath.split('/').pop();

        const removeSelf = () => {
          const idx = this.sfxAudioPool.indexOf(sfx);
          if (idx !== -1) this.sfxAudioPool.splice(idx, 1);
        };
        sfx.addEventListener('ended', removeSelf, { once: true });

        sfx.src = filePath;
        const p = sfx.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            try {
              sfx.src = flatPath;
              const p2 = sfx.play();
              if (p2 && typeof p2.catch === 'function') {
                p2.catch(() => {
                  removeSelf();
                  this._playProceduralClickSfx(140);
                });
              }
            } catch (_) {
              removeSelf();
              this._playProceduralClickSfx(140);
            }
          });
        }
        this.sfxAudioPool.push(sfx);
      } catch (_) {
        this._playProceduralClickSfx(140);
      }
    }

    _playProceduralClickSfx(freq = 400) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        if (!this._sfxCtx) this._sfxCtx = new AudioCtx();
        const ctx = this._sfxCtx;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.07);
        gain.gain.setValueAtTime(this._getEffectiveVolume() * 0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.085);
      } catch (_) {}
    }

    _getEffectiveVolume() {
      const master = Math.max(0, Math.min(1, (this.settings.masterVolume ?? 75) / 100));
      const sfx = Math.max(0, Math.min(1, (this.settings.sfxVolume ?? 80) / 100));
      return Math.max(0, Math.min(1, master * sfx));
    }

    /**
     * Raycaster Interaksi (Menghormati Dialogue Input Lock isMayaSpeaking & Quest-Locking)
     */
    _updateRaycasterInteraction() {
      if (!this.raycaster || !this.camera) return;

      // Aturan 1: Sembunyikan prompt interaksi di HUD & kunci target interaksi selama ada komunikasi aktif
      if (isCommunicationActive || this.isCommunicationActive) {
        this.currentHoveredObject = null;
        this.currentHoveredTarget = null;
        this._setInteractionPrompt('');
        return;
      }

      this.raycaster.setFromCamera(this.centerScreenNDC, this.camera);
      const visibleInteractables = this.interactables.filter((obj) => {
        let cur = obj;
        while (cur) {
          if (cur.visible === false) return false;
          cur = cur.parent;
        }
        return true;
      });
      const hits = this.raycaster.intersectObjects(visibleInteractables, false);

      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const type = hitObj.userData && hitObj.userData.interactableType;
        this.currentHoveredObject = hitObj;

        if (type === 'player_phone' && !this.hasFoundPhone) {
          this.currentHoveredTarget = 'player_phone';
          this._setInteractionPrompt('[E] Ambil Ponsel Maya');
          return;
        }

        if (type === 'key' && !this.hasRoomKey) {
          this.currentHoveredTarget = 'key';
          this._setInteractionPrompt(
            this.talkedToMark ? '[E] Ambil Kunci Kamar' : '[Terkunci Objektif] Selesaikan Panggilan Mark Dulu'
          );
          return;
        }

        if (type === 'door' && !this.isDoorOpen && !this.isDoorAnimating) {
          this.currentHoveredTarget = 'door';
          if (this.hasRoomKey && this.talkedToMark) {
            this._setInteractionPrompt('[E] Buka Pintu Kamar');
          } else {
            this._setInteractionPrompt('[Terkunci] Pintu Kamar (Tekan [E] Periksa)');
          }
          return;
        }

        if (type === 'mark_phone') {
          this.currentHoveredTarget = 'mark_phone';
          this._setInteractionPrompt('[E] Periksa Ponsel Mark yang Hancur');
          return;
        }

        if (type === 'sealed_door') {
          this.currentHoveredTarget = 'sealed_door';
          const label = hitObj.userData.roomLabel || 'Pintu Kamar';
          this._setInteractionPrompt(`[Terkunci Rapat] ${label}`);
          return;
        }

        if (this.floorExpansion && type) {
          const expPrompt = this.floorExpansion.getInteractionPrompt(type, hitObj);
          if (expPrompt) {
            this.currentHoveredTarget = type;
            this._setInteractionPrompt(expPrompt);
            return;
          }
        }
      }

      if (this.floorExpansion && typeof this.floorExpansion.getProximityInteractable === 'function') {
        const prox = this.floorExpansion.getProximityInteractable(this.camera.position);
        if (prox && prox.type) {
          this.currentHoveredObject = null;
          this.currentHoveredTarget = prox.type;
          this._setInteractionPrompt(prox.prompt || '');
          return;
        }
      }

      this.currentHoveredObject = null;
      this.currentHoveredTarget = null;
      this._setInteractionPrompt('');
    }

    /**
     * Penanganan Tombol [E] dengan Objective Gating Bersih (Pemain TIDAK PERNAH dibekukan saat dialog/radio/telepon aktif)
     */
    _handleInteractKeyE() {
      // Aturan 1 & 3: Jika pemain menekan [E] saat komunikasi (monolog/telepon/radio) berlangsung, abaikan input secara aman
      if (this.isPaused || isCommunicationActive || this.isCommunicationActive) return;

      // Langkah 1: Ambil ponsel di tempat tidur (dapat diambil kapan saja termasuk saat monolog pembuka berjalan)
      if (this.currentHoveredTarget === 'player_phone' && !this.hasFoundPhone) {
        this._playProceduralClickSfx(320);
        this._pickupPlayerPhone(true);
        return;
      }

      // Langkah 3: Ambil kunci kamar di meja (Objective Gating: hanya bisa diambil setelah panggilan telepon Mark selesai!)
      if (this.currentHoveredTarget === 'key' && !this.hasRoomKey) {
        if (this.isPhoneCalling) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Selesaikan panggilan telepon dengan Mark terlebih dahulu!');
          return;
        }
        if (!this.talkedToMark) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Hubungi Mark melalui ponsel [TAB / H] terlebih dahulu sebelum mengambil kunci!');
          return;
        }

        this.hasRoomKey = true;
        this.hasKey = true;
        if (this.keyMesh) {
          this.keyMesh.visible = false;
          this.scene.remove(this.keyMesh);
        }
        this.playOneShotSfx('assets/audio/sfx_key_pickup.mp3');
        this._updateEquipmentHUD();
        this.setObjective('Buka pintu kamar dan keluar menuju koridor lantai tiga');
        this.showHUDWarning('Kunci cadangan kamar diambil — sekarang buka pintu kamar [E].');
        this.currentHoveredTarget = null;
        this._setInteractionPrompt('');
        return;
      }

      // Langkah 4: Pintu kamar hanya bisa dibuka jika hasRoomKey === true && talkedToMark === true
      if (this.currentHoveredTarget === 'door' && !this.isDoorOpen && !this.isDoorAnimating) {
        if (this.isPhoneCalling) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Selesaikan panggilan telepon terlebih dahulu!');
          return;
        }
        if (!this.hasFoundPhone) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Ambil ponselmu di dekat tempat tidur terlebih dahulu!');
        } else if (!this.talkedToMark) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Hubungi Mark via ponsel [TAB / H] terlebih dahulu!');
        } else if (!this.hasRoomKey) {
          this._playProceduralClickSfx(110);
          this.showHUDWarning('Ambil kunci cadangan kamar di atas meja terlebih dahulu!');
        } else {
          // Syarat objektif terpenuhi: hasRoomKey === true && talkedToMark === true
          this.isLocked = false;
          this.isDoorAnimating = true;
          this.doorAnimStartTime = performance.now();
          this._playProceduralClickSfx(240);
          this._setInteractionPrompt('');
          this.setObjective('Periksa ponsel Mark yang terjatuh di lorong.');
        }
        return;
      }

      if (this.currentHoveredTarget === 'mark_phone') {
        if (!this.hasTriggeredCornerJumpscare) {
          this._triggerCornerDartJumpscare();
        } else {
          this._playProceduralClickSfx(190);
          this.showHUDWarning('Ponsel Mark hancur total — gunakan ponselmu [TAB / H] untuk menghubungi Ibu.');
          if (this.momPhonePhaseUnlocked && this.momCallState === 'idle') {
            this.setObjective('Gunakan ponselmu untuk mencari bantuan atau menghubungi kontak darurat.');
          }
        }
        return;
      }

      if (this.currentHoveredTarget === 'sealed_door') {
        this._playProceduralClickSfx(95);
        this.showHUDWarning('Terkunci rapat dari dalam. Tidak ada jawaban.');
        return;
      }

      if (this.floorExpansion && this.currentHoveredTarget) {
        this.floorExpansion.handleInteraction(this.currentHoveredTarget, this.currentHoveredObject);
      }
    }

    _updateDoorAnimation() {
      if (!this.isDoorAnimating || !this.doorPivot) return;
      const now = performance.now();
      const elapsedSec = (now - this.doorAnimStartTime) / 1000;
      const progress = Math.min(1, elapsedSec / this.doorAnimDuration);

      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.doorPivot.rotation.y = -eased * (Math.PI / 2);

      if (progress >= 1) {
        this.isDoorAnimating = false;
        this.isDoorOpen = true;
      }
    }

    _updatePlayerMovement(delta, elapsed) {
      const THREE = window.THREE;
      if (!THREE || !this.camera || this.isPaused) return;
      // Hanya hentikan gerak saat layar Game Over sedang merespawn ke checkpoint (isFatalAttackInProgress)
      // Jangan pernah membekukan gerak saat panggilan telepon, radio HT, monolog, atau inspeksi CCTV!
      if (
        this.floorExpansion &&
        (this.floorExpansion.isFatalAttackInProgress ||
          this.floorExpansion.isInApcCabin ||
          this.floorExpansion.isInHospitalBed)
      ) {
        return;
      }

      const forwardDir = new THREE.Vector3(
        -Math.sin(this.yaw),
        0,
        -Math.cos(this.yaw)
      ).normalize();

      const rightDir = new THREE.Vector3(
        Math.cos(this.yaw),
        0,
        -Math.sin(this.yaw)
      ).normalize();

      const moveVec = new THREE.Vector3();
      if (this.moveInput.forward) moveVec.add(forwardDir);
      if (this.moveInput.backward) moveVec.sub(forwardDir);
      if (this.moveInput.right) moveVec.add(rightDir);
      if (this.moveInput.left) moveVec.sub(rightDir);

      const activeHeight = this.isCrouching ? (this.crouchHeight || 0.62) : this.playerHeight;
      const floorElev = (this.floorExpansion && typeof this.floorExpansion.getFloorElevationAt === 'function')
        ? this.floorExpansion.getFloorElevationAt(this.camera.position.x, this.camera.position.z)
        : 0.0;
      const targetEyeY = floorElev + activeHeight;

      if (moveVec.lengthSq() > 0) {
        const currentSpeed = this.isCrouching
          ? this.moveSpeed * 0.62
          : (this.isSprinting ? this.moveSpeed * 1.45 : this.moveSpeed);
        moveVec.normalize().multiplyScalar(currentSpeed * delta);

        const nextX = this.camera.position.x + moveVec.x;
        const nextZ = this.camera.position.z + moveVec.z;

        if (!this._checkCollision(nextX, this.camera.position.z)) {
          this.camera.position.x = nextX;
        }
        if (!this._checkCollision(this.camera.position.x, nextZ)) {
          this.camera.position.z = nextZ;
        }

        const updatedFloorElev = (this.floorExpansion && typeof this.floorExpansion.getFloorElevationAt === 'function')
          ? this.floorExpansion.getFloorElevationAt(this.camera.position.x, this.camera.position.z)
          : 0.0;
        const bobFreq = this.isSprinting ? 11.2 : (this.isCrouching ? 5.2 : 7.5);
        const bobAmp = this.isCrouching ? 0.018 : (this.isSprinting ? 0.052 : 0.038);
        this.walkBobTimer += delta * bobFreq;
        const desiredY = (updatedFloorElev + activeHeight) + Math.sin(this.walkBobTimer) * bobAmp;
        this.camera.position.y += (desiredY - this.camera.position.y) * Math.min(1, delta * 12);
      } else {
        this.camera.position.y += (targetEyeY - this.camera.position.y) * Math.min(1, delta * 10);
      }

      if (this.keyMesh && !this.hasRoomKey) {
        this.keyMesh.rotation.y = 0.65 + Math.sin(elapsed * 1.5) * 0.08;
      }
    }

    _checkCollision(x, z) {
      const r = 0.34;

      // PENTING: Saat berada di Lantai 2, Tangga Darurat Lantai 2->1, atau Koridor Staf Lantai 1,
      // gunakan murni sistem collider area baru dan abaikan seluruh collider Kamar Tidur Lantai 3
      // agar tidak ada invisible wall di ujung bawah tangga darurat (z > -2.95)!
      if (this.floorExpansion && this.floorExpansion.isOnFloorTwo) {
        return !this.floorExpansion.isPositionWalkable(x, z, r);
      }

      const inBedroom = (x >= -3.0 + r && x <= 3.0 - r && z >= -3.0 + r && z <= 3.0 - r);
      const inDoorway = this.isDoorOpen && !this.isLocked && (x >= -0.34 && x <= 0.34 && z >= -3.35 && z <= -2.6);
      const inStraightHall = this.isDoorOpen && !this.isLocked && (
        x >= -1.4 + r &&
        x <= 1.4 - r &&
        z >= -15.0 + r &&
        z <= -2.95
      );
      const inRightCornerWing = this.floorExpansion
        ? this.floorExpansion.isPositionWalkable(x, z, r)
        : (this.isDoorOpen && x >= 1.0 && x <= 11.4 - r && z >= -15.0 + r && z <= -12.2 - r);

      if (!inBedroom && !inDoorway && !inStraightHall && !inRightCornerWing) {
        return true;
      }

      if (z > -2.95) {
        for (let i = 0; i < this.furnitureColliders.length; i++) {
          const box = this.furnitureColliders[i];
          if (
            x + r > box.minX &&
            x - r < box.maxX &&
            z + r > box.minZ &&
            z - r < box.maxZ
          ) {
            return true;
          }
        }
      }

      return false;
    }

    triggerEyeBlink() {
      if (this.isBlinking || this.isPaused || !this.eyelidsOverlay) return;
      this.isBlinking = true;
      this.eyelidsOverlay.classList.add('blinking');

      this.setPauseAwareTimeout(() => {
        if (!this.isDisposed && this.floorExpansion && typeof this.floorExpansion.onPlayerBlink === 'function') {
          this.floorExpansion.onPlayerBlink();
        }
      }, 200);

      this.setPauseAwareTimeout(() => {
        if (this.eyelidsOverlay) {
          this.eyelidsOverlay.classList.remove('blinking');
        }
        this.setPauseAwareTimeout(() => {
          this.isBlinking = false;
        }, 260);
      }, 400);
    }

    _initEventListeners() {
      this._onResize = () => {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      };

      this._onMouseMove = (e) => {
        // Mouse look (yaw/pitch) HANYA di-return saat Menu Pause [ESC] aktif atau scene sudah di-dispose.
        // TIDAK PERNAH di-disable oleh status audio, panggilan telepon, atau transmisi radio!
        if (this.isDisposed || this.isPaused || !this.camera) return;
        const isLocked = Boolean(document.pointerLockElement);
        if (!isLocked && !(e.buttons & 1)) return;

        this.settings = this._loadSettingsFromStorage(this.settings);
        const sens = Number(this.settings.mouseSensitivity) || 1.0;
        const invertFactor = this.settings.invertY ? -1 : 1;

        const lookSpeed = 0.0022 * sens;
        this.yaw -= e.movementX * lookSpeed;
        this.pitch -= e.movementY * lookSpeed * invertFactor;

        if (this.floorExpansion && this.floorExpansion.isInHospitalBed) {
          // Batasi rotasi sudut pandang mouse sekitar 60 derajat (Math.PI / 3) ke kiri dan kanan saat berbaring di ranjang rumah sakit
          const baseYaw = this.floorExpansion.hospitalBaseYaw ?? -0.42;
          const maxYawOffset = Math.PI / 3; // 60 derajat
          this.yaw = Math.max(baseYaw - maxYawOffset, Math.min(baseYaw + maxYawOffset, this.yaw));
          this.pitch = Math.max(-0.35, Math.min(0.42, this.pitch));
        } else {
          const maxPitch = Math.PI / 2.15;
          this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
        }

        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
      };

      this._onKeyDown = (e) => {
        if (this.isDisposed) return;

        // Tombol [ESC] untuk membuka/menutup Menu Pause
        if (e.key === 'Escape' || e.code === 'Escape') {
          e.preventDefault();
          this.setPaused(!this.isPaused, this.isPaused);
          return;
        }

        // Hentikan kontrol selain [ESC] HANYA saat Menu Pause aktif
        if (this.isPaused) return;

        // Pemisahan penuh: WASD, Shift/C, Spacebar, F, E, dan Tab/H TIDAK PERNAH diblokir oleh isMayaSpeaking / isRadioTransmitting!
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            e.preventDefault();
            this.moveInput.forward = true;
            break;
          case 'KeyS':
          case 'ArrowDown':
            e.preventDefault();
            this.moveInput.backward = true;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            e.preventDefault();
            this.moveInput.left = true;
            break;
          case 'KeyD':
          case 'ArrowRight':
            e.preventDefault();
            this.moveInput.right = true;
            break;
          case 'KeyF':
            e.preventDefault();
            this.toggleFlashlight();
            break;
          case 'Tab':
          case 'KeyH':
            e.preventDefault();
            this.toggleSmartphone();
            break;
          case 'KeyE':
            e.preventDefault();
            this._handleInteractKeyE();
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            e.preventDefault();
            this.isCrouching = true;
            this.isSprinting = false;
            break;
          case 'KeyC':
            e.preventDefault();
            this.isCrouching = !this.isCrouching;
            if (this.isCrouching) this.isSprinting = false;
            break;
          case 'Enter':
            if (this.isPhoneOpen && !isCommunicationActive && !this.isCommunicationActive) {
              e.preventDefault();
              if (this.momPhonePhaseUnlocked && !callFlags.momCallCompleted && !this.isMomCallCompleted) {
                this.triggerCallMom();
              } else if (!callFlags.markRoomCompleted && !this.isMarkCallCompleted && this.phoneCallState === 'idle') {
                this.triggerCallMark();
              }
            }
            break;
          case 'Space':
            e.preventDefault();
            this.triggerEyeBlink();
            break;
          default:
            break;
        }
      };

      this._onKeyUp = (e) => {
        switch (e.code) {
          case 'KeyW':
          case 'ArrowUp':
            e.preventDefault();
            this.moveInput.forward = false;
            break;
          case 'KeyS':
          case 'ArrowDown':
            e.preventDefault();
            this.moveInput.backward = false;
            break;
          case 'KeyA':
          case 'ArrowLeft':
            e.preventDefault();
            this.moveInput.left = false;
            break;
          case 'KeyD':
          case 'ArrowRight':
            e.preventDefault();
            this.moveInput.right = false;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            e.preventDefault();
            this.isCrouching = false;
            break;
          default:
            break;
        }
      };

      this._onMouseDown = (e) => {
        if (this.isDisposed || this.isPaused || e.button !== 0) return;
        // Pastikan Pointer Lock selalu aktif kembali saat pemain mengklik layar permainan
        const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
        if (targetTag !== 'BUTTON' && targetTag !== 'INPUT' && targetTag !== 'SELECT') {
          this._lockPointer();
        }
        if (this.isPhoneOpen && !isCommunicationActive && !this.isCommunicationActive) {
          const isLocked = Boolean(document.pointerLockElement);
          if (isLocked) {
            if (this.momPhonePhaseUnlocked && !callFlags.momCallCompleted && !this.isMomCallCompleted && this.momCallState === 'idle') {
              this.triggerCallMom();
            } else if (!callFlags.markRoomCompleted && !this.isMarkCallCompleted && this.phoneCallState === 'idle') {
              this.triggerCallMark();
            }
          }
        }
      };

      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove);
      window.addEventListener('mousedown', this._onMouseDown);
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);

      if (this.phoneCallBtn) {
        this._onPhoneBtnClick = (e) => {
          e.stopPropagation();
          this.triggerCallMark();
        };
        this.phoneCallBtn.addEventListener('click', this._onPhoneBtnClick);
      }

      if (this.phoneCallMomBtn) {
        this._onPhoneMomBtnClick = (e) => {
          e.stopPropagation();
          this.triggerCallMom();
        };
        this.phoneCallMomBtn.addEventListener('click', this._onPhoneMomBtnClick);
      }

      window.__blindspotSyncFppSettings = (newSettings) => {
        this.settings = { ...this.settings, ...newSettings };
        this._syncPauseSliders();
      };
    }

    _initSmartphoneClock() {
      const glitchTimes = ['03:14', '03:15', '03:??', '88:88', '03:14'];
      let idx = 0;
      this.phoneClockInterval = setInterval(() => {
        if (!this.phoneClockEl || this.isPaused) return;
        idx = (idx + 1) % glitchTimes.length;
        this.phoneClockEl.textContent = glitchTimes[idx];
      }, 2400);
    }

    setObjective(text) {
      if (this.objectiveTextEl) {
        this.objectiveTextEl.textContent = `OBJEKTIF: ${text}`;
      }
    }

    _setInteractionPrompt(text) {
      if (!this.interactionPromptEl) return;
      if (text) {
        this.interactionPromptEl.textContent = text;
        this.interactionPromptEl.classList.add('visible');
      } else {
        this.interactionPromptEl.textContent = '';
        this.interactionPromptEl.classList.remove('visible');
      }
    }

    _updateEquipmentHUD() {
      if (this.radioHudBadge) {
        if (this.hasRadioHT) {
          this.radioHudBadge.style.display = 'inline-flex';
          this.radioHudBadge.classList.add('active-badge');
        } else {
          this.radioHudBadge.style.display = 'none';
          this.radioHudBadge.classList.remove('active-badge', 'transmitting-badge');
        }
      }
      if (this.flashlightHudBadge) {
        this.flashlightHudBadge.textContent = `[F] SENTER: ${this.flashlightOn ? 'MENYALA' : 'MATI'}`;
        this.flashlightHudBadge.classList.toggle('active-badge', this.flashlightOn);
      }
      if (this.keyHudBadge) {
        if (this.hasMaintenanceKey) {
          this.keyHudBadge.textContent = 'KUNCI PANEL 3B: DITEMUKAN';
          this.keyHudBadge.classList.add('active-badge');
        } else {
          this.keyHudBadge.textContent = `KUNCI KAMAR: ${this.hasRoomKey ? 'DITEMUKAN' : 'BELUM ADA'}`;
          this.keyHudBadge.classList.toggle('active-badge', this.hasRoomKey);
        }
      }
    }

    showSubtitle(speaker, text, isAlert = false) {
      if (!this.subtitleContainerEl || !this.subtitleTextEl) return;
      if (this.subtitleSpeakerEl) {
        this.subtitleSpeakerEl.textContent = speaker ? `${speaker}:` : '';
      }
      this.subtitleTextEl.textContent = text;
      this.subtitleContainerEl.classList.toggle('alert-subtitle', Boolean(isAlert));
      this.subtitleContainerEl.classList.add('visible');
    }

    hideSubtitle() {
      if (!this.subtitleContainerEl) return;
      this.subtitleContainerEl.classList.remove('visible', 'alert-subtitle');
    }

    showTemporarySubtitle(speaker, text, durationMs = 3000) {
      this.showSubtitle(speaker, text, false);
      this.setPauseAwareTimeout(() => {
        this.hideSubtitle();
      }, durationMs);
    }

    _update(delta, elapsed) {
      this._updateLightsAndFlicker(delta, elapsed);
      this._updatePlayerMovement(delta, elapsed);
      this._checkHallwayProgressionAndJumpscare();
      this._updateShadowDartAndCameraShake(delta, elapsed);
      if (this.floorExpansion) {
        this.floorExpansion.update(delta, elapsed);
      }
      this._updateRaycasterInteraction();
      this._updateDoorAnimation();
    }

    dispose() {
      this.isDisposed = true;
      this.setMayaSpeaking(false);
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.phoneClockInterval) {
        clearInterval(this.phoneClockInterval);
      }
      this.activeTimers.forEach((t) => clearTimeout(t));
      this.activeTimers = [];
      this.pauseAwareTimers = [];

      if (this.floorExpansion && typeof this.floorExpansion._stopStaticBuzz === 'function') {
        this.floorExpansion._stopStaticBuzz();
      }

      try {
        this.voAudio.pause();
        this.voAudio.src = '';
      } catch (_) {}

      if (this.heartbeatAudio) {
        try {
          this.heartbeatAudio.pause();
          this.heartbeatAudio.src = '';
        } catch (_) {}
      }

      this.sfxAudioPool.forEach((a) => {
        try { a.pause(); } catch (_) {}
      });
      this.sfxAudioPool = [];

      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
      if (this._onMouseDown) window.removeEventListener('mousedown', this._onMouseDown);
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);

      if (this.phoneCallBtn && this._onPhoneBtnClick) {
        this.phoneCallBtn.removeEventListener('click', this._onPhoneBtnClick);
      }
      if (this.phoneCallMomBtn && this._onPhoneMomBtnClick) {
        this.phoneCallMomBtn.removeEventListener('click', this._onPhoneMomBtnClick);
      }

      this.hideSubtitle();
      this._setInteractionPrompt('');
      if (this.smartphoneEl) {
        this.smartphoneEl.classList.remove('open');
      }
      if (this.pauseOverlayEl) {
        this.pauseOverlayEl.classList.remove('open');
      }
      if (this.vignetteLayerEl) {
        this.vignetteLayerEl.classList.remove('whisper-terror-vignette');
      }

      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  }

  function initGameScene(canvasElement, settingsState) {
    if (activeGameInstance) {
      activeGameInstance.dispose();
      activeGameInstance = null;
    }
    activeGameInstance = new BlindspotFPPGameScene(canvasElement, settingsState);
    activeGameInstance.init();
    return activeGameInstance;
  }

  function stopGameScene() {
    if (activeGameInstance) {
      activeGameInstance.dispose();
      activeGameInstance = null;
    }
    if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
      try {
        document.exitPointerLock();
      } catch (_) {}
    }
  }

  window.respawnPlayer = function () {
    if (activeGameInstance && typeof activeGameInstance.respawnPlayer === 'function') {
      return activeGameInstance.respawnPlayer();
    }
    return null;
  };
  window.initGameScene = initGameScene;
  window.Blindspot.BlindspotFPPGameScene = BlindspotFPPGameScene;
  window.Blindspot.initGameScene = initGameScene;
  window.Blindspot.stopGameScene = stopGameScene;
})(window);
