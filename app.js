// DANABISNISAI - Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBKIHh8ETZEJl3lZ3wiyuNzPlGab580tTw",
  authDomain: "danabisnisai.firebaseapp.com",
  projectId: "danabisnisai",
  storageBucket: "danabisnisai.firebasestorage.app",
  messagingSenderId: "581643321490",
  appId: "1:581643321490:web:0c4d81653f7ba47d9ae64b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let semuaData = [];
let filterAktif = 'SEMUA';

const rupiah = (n) => "Rp " + Number(n||0).toLocaleString('id-ID');

// Set tanggal hari ini
document.getElementById('tgl').valueAsDate = new Date();

// Hitung preview otomatis
function hitungPreview(){
  const jual = Number(document.getElementById('jual').value||0);
  const modal = Number(document.getElementById('modalInput').value||0);
  const untung = jual - modal;
  const sedekah = untung > 0 ? untung * 0.025 : 0;
  document.getElementById('preview').innerHTML = `Untung: <b>${rupiah(untung)}</b> • Sedekah 2.5%: <b>${rupiah(sedekah)}</b> • Bersih diterima: <b>${rupiah(untung - sedekah)}</b>`;
}
document.getElementById('jual').addEventListener('input', hitungPreview);
document.getElementById('modalInput').addEventListener('input', hitungPreview);

// Login anonim
signInAnonymously(auth).catch(e=>console.log(e.message));
onAuthStateChanged(auth, (user)=>{
  if(user){
    const q = query(collection(db, "penjualan"), orderBy("tanggal","desc"));
    onSnapshot(q, (snap)=>{
      semuaData = [];
      snap.forEach(d=> semuaData.push({id:d.id, ...d.data()}));
      render();
    });
  }
});

// TAMBAH DATA
window.tambah = async function(){
  const tgl = document.getElementById('tgl').value;
  const kat = document.getElementById('kat').value;
  const nama = document.getElementById('nama').value.trim();
  const jual = Number(document.getElementById('jual').value||0);
  const modal = Number(document.getElementById('modalInput').value||0);
  if(!nama || !jual){ alert("Isi Nama & Harga Jual dulu!"); return; }
  const untung = jual - modal;
  const sedekah = untung > 0 ? untung * 0.025 : 0;
  try{
    await addDoc(collection(db, "penjualan"), {tanggal:tgl, kategori:kat, nama:nama, jual:jual, modal:modal, untung:untung, sedekah:sedekah});
    document.getElementById('nama').value="";
    document.getElementById('jual').value="";
    document.getElementById('modalInput').value="";
    hitungPreview();
    alert("Berhasil disimpan!");
  }catch(e){ alert("Gagal: "+e.message); }
}

// RENDER + FILTER + CARI
window.filterK = function(kat, el){
  filterAktif = kat;
  document.querySelectorAll('.top button').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  render();
}

window.render = function(){
  const cari = document.getElementById('cari').value.toLowerCase();
  let totalOmzet=0, totalModal=0, totalUntung=0, totalSedekah=0;
  // Hitung total dari SEMUA data (bukan yg difilter)
  semuaData.forEach(d=>{ totalOmzet+=Number(d.jual||0); totalModal+=Number(d.modal||0); totalUntung+=Number(d.untung||0); totalSedekah+=Number(d.sedekah||0); });
  document.getElementById('omzet').innerText = rupiah(totalOmzet);
  document.getElementById('modal').innerText = rupiah(totalModal);
  document.getElementById('untungBersih').innerText = rupiah(totalUntung - totalSedekah);
  document.getElementById('sedekah').innerText = rupiah(totalSedekah);

  const tampil = semuaData.filter(d=>{
    const cocokKat = filterAktif==='SEMUA' || d.kategori===filterAktif;
    const cocokCari = d.nama.toLowerCase().includes(cari);
    return cocokKat && cocokCari;
  });

  const list = document.getElementById('list');
  if(tampil.length===0){ list.innerHTML="<p style='text-align:center;opacity:.6'>Belum ada data</p>"; return; }
  list.innerHTML = tampil.map(d=>`
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee">
      <div><b>${d.nama}</b><br><small>${d.tanggal} • ${d.kategori}</small><br><small>Jual ${rupiah(d.jual)} - Modal ${rupiah(d.modal)}</small></div>
      <div style="text-align:right"><b style="color:#16a34a">${rupiah(d.untung)}</b><br><small>Sedekah ${rupiah(d.sedekah)}</small><br><button onclick="hapusSatu('${d.id}')" style="color:red;border:none;background:none;cursor:pointer">Hapus</button></div>
    </div>
  `).join('');
}

window.hapusSatu = async function(id){
  if(confirm("Hapus data ini?")) await deleteDoc(doc(db, "penjualan", id));
}

window.hapusSemua = async function(){
  if(!confirm("Hapus SEMUA data?")) return;
  const snap = await getDocs(collection(db, "penjualan"));
  for(let d of snap.docs) await deleteDoc(doc(db, "penjualan", d.id));
}

window.exportCSV = function(){
  let csv = "Tanggal,Kategori,Nama,Harga Jual,Modal,Untung,Sedekah\n";
  semuaData.forEach(d=>{ csv += `${d.tanggal},${d.kategori},"${d.nama}",${d.jual},${d.modal},${d.untung},${d.sedekah}\n`; });
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = "laporan-danabisnisai.csv";
  a.click();
}