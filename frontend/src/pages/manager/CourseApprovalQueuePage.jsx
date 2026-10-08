import React, {useState} from 'react';
import {BookOpen, Clock3, Trophy, CalendarDays, Users, PlayCircle, Plus, Upload, Search, MoreHorizontal, CheckCircle2, AlertCircle, Sparkles, FileSpreadsheet, Download, Filter, Eye, Lock, Server, Database, HardDrive, ShieldCheck, Mail, Save, UserPlus, SlidersHorizontal} from 'lucide-react';
import {PortalHeader,Button,StatCard,Progress,Card,SectionTitle,Table,Badge,Field} from '../../components/portal/PortalUI';

export default function CourseApprovalQueuePage(){return <><PortalHeader eyebrow="CONTENT REVIEW" title="Hàng đợi phê duyệt" desc="Kiểm tra các khóa học đang chờ được xuất bản."/><div className="filter-bar"><div className="tabs"><button className="tab active">Chờ duyệt 12</button><button className="tab">Đã duyệt</button><button className="tab">Từ chối</button></div><Button variant="secondary"><Filter size={16}/> Bộ lọc</Button></div><Card><Table headers={['Khóa học','Giảng viên','Danh mục','Bài học','Gửi lúc','Trạng thái','Thao tác']} rows={[
['React Advanced Patterns','Nguyễn Minh Anh','Lập trình','28','01/10 09:42'],
['IELTS Writing Intensive','Trần Thu Hà','Ngoại ngữ','36','01/10 08:30'],
['SQL for Data Analyst','Lê Quốc Bảo','Database','24','30/09 16:20'],
['Python Machine Learning','Phạm Quốc Huy','Data','42','30/09 14:12']
].map(r=>[<b>{r[0]}</b>,r[1],r[2],r[3],r[4],<Badge tone="orange">Chờ duyệt</Badge>,<Button variant="ghost"><Eye size={16}/> Xem</Button>])}/></Card></>}
