import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sprout, Download, LogIn, FileText, Sparkles, TrendingUp, Zap, Cloud, Lock, UserPlus, Globe2, FlaskConical, ShieldAlert, CheckCircle2, Languages, Trash2, History, Clock, Leaf } from 'lucide-react';
import TutorialModal from '../components/TutorialModal';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// ── India States & Districts ─────────────────────────────────────────────────
const STATE_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": ["Alluri Sitharama Raju","Anakapalli","Anantapur","Annamayya","Bapatla","Chittoor","Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna","Kurnool","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Prakasam","Sri Potti Sriramulu Nellore","Sri Sathya Sai","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw","Chang Lang","Dibang Valley","East Kameng","East Siang","Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley","Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang","Tawang","Tirap","Upper Dibang Valley","Upper Siang","Upper Subansiri","West Kameng","West Siang"],
  "Assam": ["Bajali","Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang","Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi","Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar","Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur","South Salmara-Mankachar","Tinsukia","Udalguri","West Karbi Anglong"],
  "Bihar": ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"],
  "Chhattisgarh": ["Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada","Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur","Kabirdham","Kanker","Khairagarh","Kondagaon","Korba","Koriya","Mahasamund","Manendragarh","Mohla-Manpur","Mungeli","Narayanpur","Raigarh","Raipur","Rajnandgaon","Sarangarh-Bilaigarh","Sukma","Surajpur","Surguja"],
  "Goa": ["North Goa","South Goa"],
  "Gujarat": ["Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad","Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar","Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal","Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad"],
  "Haryana": ["Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar","Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat","Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi","Shimla","Sirmaur","Solan","Una"],
  "Jharkhand": ["Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda","Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu","Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum"],
  "Karnataka": ["Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal","Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"],
  "Kerala": ["Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode","Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad"],
  "Madhya Pradesh": ["Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind","Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori","Guna","Gwalior","Harda","Hoshangabad","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Mandla","Mandsaur","Morena","Narsinghpur","Neemuch","Niwari","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni","Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria","Vidisha"],
  "Maharashtra": ["Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"],
  "Manipur": ["Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching","Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul"],
  "Meghalaya": ["East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills","North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills","South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills"],
  "Mizoram": ["Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha","Saitual","Serchhip"],
  "Nagaland": ["Chumoukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak","Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto"],
  "Odisha": ["Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Sonepur","Sundargarh"],
  "Punjab": ["Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur","Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga","Mohali","Muktsar","Pathankot","Patiala","Rupnagar","Sangrur","Shaheed Bhagat Singh Nagar","Tarn Taran"],
  "Rajasthan": ["Ajmer","Alwar","Banswara","Baran","Barmer","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Dholpur","Dungarpur","Hanumangarh","Jaipur","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Karauli","Kota","Nagaur","Pali","Pratapgarh","Rajsamand","Sawai Madhopur","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"],
  "Sikkim": ["East Sikkim","North Sikkim","Pakyong","Soreng","South Sikkim","West Sikkim"],
  "Tamil Nadu": ["Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi","Kancheepuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram","Virudhunagar"],
  "Telangana": ["Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon","Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam","Kumuram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri","Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli","Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy","Warangal","Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti","West Tripura"],
  "Uttar Pradesh": ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Rae Bareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"],
  "Uttarakhand": ["Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi"],
  "West Bengal": ["Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly","Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia","North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman","Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur"],
  "Andaman and Nicobar Islands": ["Nicobar","North and Middle Andaman","South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli","Daman","Diu"],
  "Delhi": ["Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi","Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi"],
  "Jammu and Kashmir": ["Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar","Kulgam","Kupwara","Poonch","Pulwama","Ramban","Reasi","Samba","Shopian","Srinagar","Udhampur"],
  "Ladakh": ["Kargil","Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal","Mahe","Puducherry","Yanam"],
};

const INDIA_STATES = Object.keys(STATE_DISTRICTS).sort();

// ── Interfaces ───────────────────────────────────────────────────────────────
interface ReportHistory {
  _id: string;
  crop_name: string;
  state: string;
  district: string;
  language: string;
  timestamp: string;
  report_data: CropReport;
}

interface CropReport {
  crop: string;
  state: string;
  district: string;
  language: string;
  farming_type?: string;
  environmentalSummary: string[];
  cropRequirementSummary: string[];
  compatibilityAnalysis: string[];
  suitabilityScore: string[];
  qualityImpactAnalysis: string[];
  economicFeasibility?: string[];
  finalRecommendation: string[];
}

// ── Component ────────────────────────────────────────────────────────────────
const ReportPage = () => {
  const [cropName, setCropName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('English');
  const [report, setReport] = useState<CropReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const availableDistricts = useMemo(
    () => (state ? STATE_DISTRICTS[state] ?? [] : []),
    [state]
  );

  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    if (token) fetchReportHistory();
  }, []);

  const fetchReportHistory = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingHistory(true);
    try {
      const res = await fetch(getApiUrl(API_ENDPOINTS.REPORTS), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setReportHistory(await res.json());
    } catch (e) {
      console.error('Error fetching report history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadHistoryReport = (item: ReportHistory) => {
    setCropName(item.crop_name);
    setState(item.state);
    setDistrict(item.district);
    setLanguage(item.language);
    setReport(item.report_data);
    setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const deleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingReportId(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(getApiUrl(`${API_ENDPOINTS.REPORTS}/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setReportHistory((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      console.error('Error deleting report:', e);
    } finally {
      setDeletingReportId(null);
    }
  };

  const clearReport = () => {
    setReport(null);
    setCropName('');
    setState('');
    setDistrict('');
    setLanguage('English');
  };

  const downloadPDF = async () => {
    if (!reportRef.current || !report) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgX = (pdfWidth - canvas.width * ratio) / 2;
      pdf.addImage(imgData, 'PNG', imgX, 10, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`${report.crop}_${report.district}_${report.state}_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateReport = async () => {
    if (!cropName || !state || !district) return;
    setIsGenerating(true);
    setReport(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_ENDPOINTS.REPORT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ cropName, state, district, language }),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      const data = await response.json();
      if (data.error) {
        alert(`Error: ${data.error}`);
        return;
      }
      setReport(data);
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
      fetchReportHistory();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-teal-950 dark:to-gray-900 transition-all duration-500">

      {/* Authentication Overlay */}
      {!isAuthenticated && (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full border border-white/20 dark:border-gray-700/30"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 dark:from-green-500 dark:via-emerald-600 dark:to-teal-700 rounded-t-3xl" />
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex justify-center mb-6"
            >
              <Lock size={64} className="text-green-600 dark:text-green-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 dark:from-green-400 dark:via-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2">
              Premium Feature 🌟
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-6">
              Personalized crop reports are available for logged-in users only. Sign in to access AI-powered farming insights!
            </p>
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <LogIn size={20} />
                <span>Sign In</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200"
              >
                <UserPlus size={20} />
                <span>Create Account</span>
              </motion.button>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className={!isAuthenticated ? 'filter blur-lg pointer-events-none select-none' : ''}>
          <div className="max-w-7xl mx-auto">

            {/* Hero Header */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 relative"
            >
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-8 left-1/4 text-6xl opacity-20"
              >
                🌾
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -top-4 right-1/4 text-5xl opacity-20"
              >
                📊
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="inline-block mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800 blur-2xl opacity-30 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-4 rounded-2xl shadow-2xl">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-4 pb-2 leading-tight"
              >
                Personalized Farming Reports
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
              >
                Get AI-powered customized farming advice based on your crop and location
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap justify-center gap-3 mt-6"
              >
                {[
                  { icon: TrendingUp, text: 'Data Driven' },
                  { icon: Zap, text: 'Instant Advice' },
                  { icon: Cloud, text: 'Weather Ready' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 dark:border-emerald-800"
                  >
                    <feature.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Main layout: history sidebar (left) + form+results */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* ── History Sidebar (LEFT) ── */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="lg:w-80 w-full flex-shrink-0"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700 sticky top-4 transition-all duration-300">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                      <History className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report History</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Your past reports</p>
                    </div>
                    {isAuthenticated && reportHistory.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-sm px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors font-medium"
                      >
                        {showHistory ? 'Hide' : 'Show'}
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {!isAuthenticated ? (
                      <motion.div key="h-login" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-8">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
                        >
                          <LogIn className="text-emerald-600 dark:text-emerald-400" size={36} />
                        </motion.div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">Login to save &amp; view history</p>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/auth')}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                          Login / Sign Up
                        </motion.button>
                      </motion.div>
                    ) : isLoadingHistory ? (
                      <motion.div key="h-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-teal-500 rounded-full" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading history...</p>
                      </motion.div>
                    ) : reportHistory.length === 0 ? (
                      <motion.div key="h-empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center py-8">
                        <div className="bg-gray-100 dark:bg-gray-700/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <History className="text-gray-400 dark:text-gray-500" size={36} />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No reports yet<br />Generate your first report!</p>
                      </motion.div>
                    ) : showHistory ? (
                      <motion.div key="h-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="space-y-3 max-h-[600px] overflow-y-scroll overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-700/50">
                        {reportHistory.map((item, idx) => (
                          <motion.div
                            key={item._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            onClick={() => loadHistoryReport(item)}
                            className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl cursor-pointer shadow-md hover:shadow-lg transition-all border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 group"
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-300/20 dark:bg-emerald-700/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                  <h4 className="font-bold text-gray-800 dark:text-gray-100 truncate">{item.crop_name}</h4>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span className="truncate">{item.district}, {item.state}</span>
                                </p>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Clock size={12} className="mr-1 flex-shrink-0" />
                                  {formatDate(item.timestamp)}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className="text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full shadow-sm">{item.language}</span>
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => deleteHistoryItem(e, item._id)}
                                  disabled={deletingReportId === item._id}
                                  title="Delete"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-500 dark:text-red-400 disabled:opacity-40"
                                >
                                  {deletingReportId === item._id
                                    ? <span className="text-[10px] font-bold px-0.5">...</span>
                                    : <Trash2 size={13} />}
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.div>

            <div className="flex-1 min-w-0">

            {/* Input Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Agricultural Suitability Report
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Provide 4 inputs — environmental &amp; crop data are auto-fetched
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full" />
                  <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Basic Information
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

                  {/* Crop Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Crop Name *
                    </label>
                    <input
                      type="text"
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      placeholder="e.g., Rice, Wheat, Mango"
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      State *
                    </label>
                    <select
                      value={state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300"
                    >
                      <option value="">— Select State —</option>
                      {INDIA_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      District *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={!state}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <option value="">{state ? '— Select District —' : '— Select State first —'}</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      <Languages className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Report Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                      <option value="Bengali">বাংলা (Bengali)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Malayalam">മലയാളം (Malayalam)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                      <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="Urdu">اردو (Urdu)</option>
                      <option value="Assamese">অসমীয়া (Assamese)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Auto-Fetch Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6 flex items-start gap-3 bg-gradient-to-r from-sky-50 to-teal-50 dark:from-sky-900/30 dark:to-teal-900/30 border-2 border-sky-200 dark:border-sky-700 rounded-2xl px-5 py-4"
              >
                <div className="p-2 bg-sky-100 dark:bg-sky-800/60 rounded-xl mt-0.5 flex-shrink-0">
                  <Cloud className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-0.5">Auto-Fetch Enabled</p>
                  <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                    Environmental data (temperature, humidity, soil type) and crop requirement benchmarks are{' '}
                    <strong>automatically fetched</strong> from live weather sensors and AgriGPT's crop database — no manual entry needed.
                  </p>
                </div>
              </motion.div>

              <motion.button
                onClick={generateReport}
                disabled={!cropName || !district || !state || isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Sparkles className="w-6 h-6 relative z-10" />
                <span className="relative z-10">
                  {isGenerating ? 'Generating Suitability Report...' : `Generate Report in ${language}`}
                </span>
                {!isGenerating && <CheckCircle2 className="w-5 h-5 relative z-10" />}
              </motion.button>
            </motion.div>

            {/* Loading State */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-gray-200 dark:border-gray-700 mb-8"
                >
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0"
                    >
                      <div className="w-full h-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 rounded-full" />
                    </motion.div>
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-2"
                    >
                      <div className="w-full h-full border-4 border-transparent border-b-emerald-400 border-l-teal-400 rounded-full" />
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-emerald-500" />
                    </div>
                  </div>
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Generating Report...</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      Creating suitability analysis for{' '}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{cropName}</span> in{' '}
                      <span className="font-semibold text-teal-600 dark:text-teal-400">{district}, {state}</span>
                    </p>
                  </motion.div>
                  <div className="mt-8 space-y-2">
                    {[
                      'Fetching live weather & soil data...',
                      'Comparing with crop requirements database...',
                      'Calculating suitability score...',
                    ].map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.3 }}
                        className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 justify-center"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: index * 0.3 }}
                          className="w-2 h-2 bg-emerald-500 rounded-full"
                        />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Report Results */}
            <AnimatePresence>
              {report && (
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 40 }}
                  transition={{ duration: 0.6 }}
                  ref={reportRef}
                  className="space-y-8"
                >
                  {/* Report Header */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-800 dark:to-cyan-800 text-white rounded-3xl p-8 shadow-2xl border-2 border-emerald-400/30 dark:border-emerald-700/50"
                  >
                    <div className="absolute inset-0 opacity-10">
                      <motion.div
                        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                        className="w-full h-full"
                        style={{
                          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                          backgroundSize: '30px 30px',
                        }}
                      />
                    </div>
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-3 mb-3"
                        >
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <FileText className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className="text-3xl md:text-4xl font-bold">Agricultural Suitability Report</h2>
                            <p className="text-white/90 text-sm mt-1">AI-Generated Decision Support Analysis</p>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center gap-2 text-lg">
                            <Sprout className="w-5 h-5" />
                            <span className="font-semibold">Crop:</span>
                            <span className="font-bold text-yellow-200">{report.crop}</span>
                          </div>
                          <div className="flex items-center gap-2 text-lg">
                            <MapPin className="w-5 h-5" />
                            <span className="font-semibold">Location:</span>
                            <span className="font-bold text-yellow-200">{report.district}, {report.state}</span>
                          </div>
                          <div className="flex items-center gap-2 text-base">
                            <Languages className="w-4 h-4" />
                            <span className="font-semibold">Language:</span>
                            <span className="font-bold text-yellow-200">{report.language}</span>
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={downloadPDF}
                          disabled={isDownloading}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 border border-white/30"
                        >
                          <Download size={22} />
                          <span className="font-bold text-lg">{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={clearReport}
                          className="bg-red-500/30 hover:bg-red-500/50 backdrop-blur-md px-6 py-3 rounded-xl flex items-center gap-3 transition-all shadow-lg hover:shadow-xl border border-red-300/40 hover:border-red-300/70"
                        >
                          <Trash2 size={22} />
                          <span className="font-bold text-lg">Clear</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid lg:grid-cols-2 gap-6">

                    {/* 1. Environmental Summary */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-sky-200 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg"><Cloud className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">1. Environmental Summary</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current site conditions</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {report.environmentalSummary.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border border-sky-200 dark:border-sky-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 2. Crop Requirements */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-green-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg"><Sprout className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">2. Crop Requirements</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ideal growing parameters</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {report.cropRequirementSummary.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 3. Compatibility Analysis */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg"><FlaskConical className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">3. Compatibility Analysis</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Temp · Humidity · Rainfall · Soil</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {report.compatibilityAnalysis.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 4. Suitability Score */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg"><Zap className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">4. Suitability Score</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Score /100 with classification</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {report.suitabilityScore.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className={`p-3 rounded-xl border hover:shadow-md transition-all ${idx === 0
                                ? 'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 border-violet-300 dark:border-violet-700 font-bold'
                                : 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800'}`}>
                              <p className="text-gray-800 dark:text-gray-100 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 5. Quality Impact */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-rose-200 dark:border-rose-800 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg"><ShieldAlert className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">5. Quality Impact</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Risks &amp; quality effects</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {report.qualityImpactAnalysis.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 6. Economic Feasibility */}
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-lime-400 to-green-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-lime-200 dark:border-lime-800 hover:border-lime-400 dark:hover:border-lime-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl shadow-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">6. Economic Feasibility</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Market viability &amp; profitability</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {(report.economicFeasibility ?? []).map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.85 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/30 dark:to-green-900/30 border border-lime-200 dark:border-lime-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    {/* 7. Final Recommendation — full width */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="relative group lg:col-span-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border-2 border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg"><CheckCircle2 className="w-6 h-6 text-white" /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">7. Final Recommendation</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Actionable expert guidance</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          {report.finalRecommendation.map((item, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 + idx * 0.1 }} whileHover={{ scale: 1.02, x: 4 }}
                              className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 border border-teal-200 dark:border-teal-800 hover:shadow-md transition-all">
                              <p className="text-gray-700 dark:text-gray-200 font-medium leading-relaxed text-sm">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>{/* end flex-1 main */}
            </div>{/* end flex row */}

          </div>
        </div>
      </div>

      {/* Page Tutorial */}
      <TutorialModal
        accentColor="green"
        pageTitle="Agricultural Suitability Report"
        pageDescription="Generate AI-powered suitability reports to analyse whether your crop suits the current environmental conditions."
        steps={[
          {
            title: 'Basic Information',
            description: 'Enter the crop name, select your state, then pick the district from the cascading dropdown, and choose the report language.',
            icon: <Sprout size={28} />,
            tip: 'The report language setting controls the language of the entire generated analysis.',
          },
          {
            title: 'Auto-Fetch Data',
            description: "No manual data entry needed! Environmental data (temperature, humidity, soil type) and crop requirement benchmarks are automatically fetched from live weather sensors and AgriGPT's crop database.",
            icon: <Cloud size={28} />,
            tip: 'Selecting the correct district ensures accurate local weather and soil data.',
          },
          {
            title: 'Generate the Report',
            description: 'Click "Generate Report". The AI fetches live data and generates 7 sections: Environmental Summary, Crop Requirements, Compatibility Analysis, Suitability Score, Quality Impact, Economic Feasibility, and Final Recommendation.',
            icon: <Sparkles size={28} />,
            tip: 'Generation takes about 20–30 seconds including the live data fetch.',
          },
          {
            title: 'Download as PDF',
            description: 'Once generated, click the Download button at the top of the report to save a formatted PDF of the complete suitability analysis.',
            icon: <Download size={28} />,
          },
          {
            title: 'Report History',
            description: 'All previously generated suitability reports are saved. Click any history entry to instantly reload that report.',
            icon: <History size={28} />,
            tip: 'Report history is only available when you are logged in.',
          },
        ]}
      />
    </div>
  );
};

export default ReportPage;
