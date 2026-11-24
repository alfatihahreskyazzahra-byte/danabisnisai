// DANABISNISAI - Firebase - VERSI ADA BELANJA
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
let semuaBelanja = [];
let filterAktif = 'SEMUA';
let editId = null;
let editBelanjaId = null;

const rupiah = (n) => "Rp " + Number(n||0).toLocaleString('id-ID');

document.getElementById('tgl').valueAsDate = new Date();
if(document.getElementById('tglBelanja')) document.getElementById('tglBelanja').valueAsDate = new Date();

function hitungPreview(){
  const jual = Number(document.getElementById('jual').value||0);
  const modal = Number(document.getElementById('modalInput').value||0);
  const untung = jual - modal;
  const sedekah = untung > 0 ? untung * 0.025 : 0;
  document.getElementById('preview').innerHTML = `Untung: <b>${rupiah(untung)}</b> • Sedekah 2.5%: <b>${rupiah(sedekah)}</b> • Bersih diterima: <b>${rupiah(untung - sedekah)}</b>`;
}
document.getElementById('jual').addEventListener('input', hitungPreview);
document.getElementById('modalInput').addEventListener('input', hitungPreview);

signInAnonymously(auth).catch(e=>console.log(e.message));
onAuthStateChanged(auth, (user)=>{
  if(user){
    const q = query(collection(db, "penjualan"), orderBy("tanggal","desc"));
    onSnapshot(q, (snap)=>{
      semuaData = [];
      snap.forEach(d=> semuaData.push({id:d.id, ...d.data()}));
      render();
    });
    const qb = query(collection(db, "belanja"), orderBy("tanggal","desc"));
    onSnapshot(qb, (snap)=>{
      semuaBelanja = [];
      snap.forEach(d=> semuaBelanja.push({id:d.id, ...d.data()}));
      renderBelanja();
      render();
    });
  }
});

// TAMBAH / SIMPAN EDIT PENJUALAN - TIDAK DIUBAH
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
    if(editId){
      await updateDoc(doc(db, "penjualan", editId), {tanggal:tgl, kategori:kat, nama:nama, jual:jual, modal:modal, untung:untung, sedekah:sedekah});
      alert("Berhasil diupdate!");
      batalEdit();
    } else {
      await addDoc(collection(db, "penjualan"), {tanggal:tgl, kategori:kat, nama:nama, jual:jual, modal:modal, untung:untung, sedekah:sedekah});
      alert("Berhasil disimpan!");
    }
    document.getElementById('nama').value="";
    document.getElementById('jual').value="";
    document.getElementById('modalInput').value="";
    document.getElementById('tgl').valueAsDate = new Date();
    hitungPreview();
  }catch(e){ alert("Gagal: "+e.message); }
}

window.mulaiEdit = function(id){
  const d = semuaData.find(x => x.id === id);
  if(!d) return;
  document.getElementById('tgl').value = d.tanggal;
  document.getElementById('kat').value = d.kategori;
  document.getElementById('nama').value = d.nama;
  document.getElementById('jual').value = d.jual;
  document.getElementById('modalInput').value = d.modal;
  hitungPreview();
  editId = id;
  const btnSimpan = document.getElementById('btnSimpan');
  if(btnSimpan) btnSimpan.innerText = "SIMPAN PERUBAHAN";
  const btnBatal = document.getElementById('btnBatal');
  if(btnBatal) btnBatal.style.display = "block";
  window.scrollTo({top:0, behavior:'smooth'});
  document.getElementById('nama').focus();
}

window.batalEdit = function(){
  editId = null;
  document.getElementById('nama').value="";
  document.getElementById('jual').value="";
  document.getElementById('modalInput').value="";
  document.getElementById('tgl').valueAsDate = new Date();
  hitungPreview();
  const btnSimpan = document.getElementById('btnSimpan');
  if(btnSimpan) btnSimpan.innerText = "SIMPAN PENJUALAN";
  const btnBatal = document.getElementById('btnBatal');
  if(btnBatal) btnBatal.style.display = "none";
}

window.filterK = function(kat, el){
  filterAktif = kat;
  document.querySelectorAll('.top button').forEach(b=>b.classList.remove('active'));
  if(el) el.classList.add('active');
  render();
}

// ===== BELANJA BARU =====
window.tambahBelanja = async function(){
  const tgl = document.getElementById('tglBelanja').value;
  const kat = document.getElementById('katBelanja').value;
  const nama = document.getElementById('namaBelanja').value.trim();
  const jumlah = Number(document.getElementById('jumlahBelanja').value||0);
  if(!nama || !jumlah){ alert("Isi Nama Barang Belanja & Jumlah Belanja dulu!"); return; }
  try{
    if(editBelanjaId){
      await updateDoc(doc(db, "belanja", editBelanjaId), {tanggal:tgl, kategori:kat, nama:nama, jumlah:jumlah});
      alert("Belanja berhasil diupdate!");
      batalEditBelanja();
    } else {
      await addDoc(collection(db, "belanja"), {tanggal:tgl, kategori:kat, nama:nama, jumlah:jumlah});
      alert("Belanja berhasil disimpan! Omzet langsung berkurang.");
    }
    document.getElementById('namaBelanja').value="";
    document.getElementById('jumlahBelanja').value="";
    document.getElementById('tglBelanja').valueAsDate = new Date();
  }catch(e){ alert("Gagal: "+e.message); }
}

window.mulaiEditBelanja = function(id){
  const d = semuaBelanja.find(x => x.id === id);
  if(!d) return;
  document.getElementById('tglBelanja').value = d.tanggal;
  document.getElementById('katBelanja').value = d.kategori;
  document.getElementById('namaBelanja').value = d.nama;
  document.getElementById('jumlahBelanja').value = d.jumlah;
  editBelanjaId = id;
  const btn = document.getElementById('btnSimpanBelanja');
  if(btn) btn.innerText = "SIMPAN PERUBAHAN BELANJA";
  const btnB = document.getElementById('btnBatalBelanja');
  if(btnB) btnB.style.display = "block";
  window.scrollTo({top:0, behavior:'smooth'});
  document.getElementById('namaBelanja').focus();
}

window.batalEditBelanja = function(){
  editBelanjaId = null;
  document.getElementById('namaBelanja').value="";
  document.getElementById('jumlahBelanja').value="";
  document.getElementById('tglBelanja').valueAsDate = new Date();
  const btn = document.getElementById('btnSimpanBelanja');
  if(btn) btn.innerText = "SIMPAN BELANJA";
  const btnB = document.getElementById('btnBatalBelanja');
  if(btnB) btnB.style.display = "none";
}

window.hapusSatuBelanja = async function(id){
  if(confirm("Hapus data belanja ini? Omzet akan kembali naik.")) await deleteDoc(doc(db, "belanja", id));
  if(editBelanjaId === id) batalEditBelanja();
}

window.hapusSemuaBelanja = async function(){
  if(!confirm("Hapus SEMUA data Belanja? Omzet akan kembali ke semula.")) return;
  const snap = await getDocs(collection(db, "belanja"));
  for(let d of snap.docs) await deleteDoc(doc(db, "belanja", d.id));
}

window.renderBelanja = function(){
  const cariEl = document.getElementById('cariBelanja');
  const cari = cariEl ? cariEl.value.toLowerCase() : "";
  const list = document.getElementById('listBelanja');
  if(!list) return;
  const tampil = semuaBelanja.filter(d=> (d.nama||"").toLowerCase().includes(cari));
  if(tampil.length===0){ list.innerHTML="<p style='text-align:center;opacity:.6'>Belum ada belanja</p>"; return; }
  list.innerHTML = tampil.map(d=>`
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee">
      <div><b>${d.nama}</b><br><small>${d.tanggal} • ${d.kategori}</small></div>
      <div style="text-align:right"><b style="color:#ea580c">${rupiah(d.jumlah)}</b><br><button onclick="mulaiEditBelanja('${d.id}')" style="color:#2563eb;border:none;background:none;cursor:pointer;font-weight:bold">Edit</button> | <button onclick="hapusSatuBelanja('${d.id}')" style="color:red;border:none;background:none;cursor:pointer">Hapus</button></div>
    </div>
  `).join('');
}

// RENDER PENJUALAN - SUDAH DITAMBAH PENGURANGAN BELANJA
window.render = function(){
  const cari = document.getElementById('cari').value.toLowerCase();
  let totalOmzetKotor=0, totalModal=0, totalUntung=0, totalSedekah=0;
  semuaData.forEach(d=>{ totalOmzetKotor+=Number(d.jual||0); totalModal+=Number(d.modal||0); totalUntung+=Number(d.untung||0); totalSedekah+=Number(d.sedekah||0); });
  let totalBelanja=0;
  semuaBelanja.forEach(d=>{ totalBelanja+=Number(d.jumlah||0); });
  const totalOmzetBersih = totalOmzetKotor - totalBelanja;
  const totalUntungBersih = (totalUntung - totalSedekah);

  document.getElementById('omzet').innerText = rupiah(totalOmzetBersih);
  const detail = document.getElementById('omzetDetail');
  if(detail) detail.innerText = `Kotor ${rupiah(totalOmzetKotor)} - Belanja ${rupiah(totalBelanja)}`;
  const totalBelanjaText = document.getElementById('totalBelanjaText');
  if(totalBelanjaText) totalBelanjaText.innerText = rupiah(totalBelanja);
  document.getElementById('modal').innerText = rupiah(totalModal);
  document.getElementById('untungBersih').innerText = rupiah(totalUntungBersih);
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
      <div style="text-align:right"><b style="color:#16a34a">${rupiah(d.untung)}</b><br><small>Sedekah ${rupiah(d.sedekah)}</small><br><button onclick="mulaiEdit('${d.id}')" style="color:#2563eb;border:none;background:none;cursor:pointer;font-weight:bold">Edit</button> | <button onclick="hapusSatu('${d.id}')" style="color:red;border:none;background:none;cursor:pointer">Hapus</button></div>
    </div>
  `).join('');
}

window.hapusSatu = async function(id){
  if(confirm("Hapus data ini?")) await deleteDoc(doc(db, "penjualan", id));
  if(editId === id) batalEdit();
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
