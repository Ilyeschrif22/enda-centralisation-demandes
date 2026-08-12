//package com.enda.backend.service;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Service;
//
//@Service
//@RequiredArgsConstructor
//public class EligibiliteNotificationService {
//
//    private final EmailService emailService;
//
//    @Value("${alert.eligibilite.recipient}")
//    private String eligibiliteRecipient;
//
//    public void alerterAgeNonEligible(String nomPrenom, String cin, int age, String raison) {
//        String subject = "Alerte éligibilité âge - " + nomPrenom;
//        String body = buildHtmlTemplate(nomPrenom, cin, age, raison);
//        emailService.sendHtml(eligibiliteRecipient, subject, body);
//    }
//
//    private String buildHtmlTemplate(String nomPrenom, String cin, int age, String raison) {
//
//        String template = """
//<!DOCTYPE html>
//<html lang="fr">
//<head>
//<meta charset="UTF-8">
//
//<style>
//
//body{
//    margin:0;
//    padding:40px 0;
//    background:#f5f7fa;
//    font-family:Arial,Helvetica,sans-serif;
//    color:#1f2937;
//}
//
//.container{
//    width:640px;
//    margin:auto;
//    background:#ffffff;
//    border:1px solid #e5e7eb;
//}
//
//.top-bar{
//    height:6px;
//    background:#b5125b;
//}
//
//.content{
//    padding:40px;
//}
//
//.logo{
//    font-size:24px;
//    font-weight:700;
//    color:#111827;
//    margin-bottom:8px;
//}
//
//.subtitle{
//    color:#6b7280;
//    font-size:14px;
//    margin-bottom:32px;
//}
//
//.badge{
//    display:inline-block;
//    padding:6px 14px;
//    border-radius:30px;
//    background:#fef2f2;
//    color:#b91c1c;
//    font-size:12px;
//    font-weight:bold;
//    border:1px solid #fecaca;
//    margin-bottom:24px;
//}
//
//.title{
//    font-size:26px;
//    font-weight:700;
//    color:#111827;
//    margin-bottom:14px;
//}
//
//.description{
//    color:#4b5563;
//    line-height:1.7;
//    font-size:15px;
//    margin-bottom:32px;
//}
//
//.card{
//    border:1px solid #e5e7eb;
//    background:#fafafa;
//    padding:0;
//}
//
//.row{
//    display:flex;
//    border-bottom:1px solid #e5e7eb;
//}
//
//.row:last-child{
//    border-bottom:none;
//}
//
//.label{
//    width:180px;
//    background:#f3f4f6;
//    padding:16px 20px;
//    font-weight:600;
//    color:#6b7280;
//    font-size:14px;
//}
//
//.value{
//    flex:1;
//    padding:16px 20px;
//    color:#111827;
//    font-size:14px;
//}
//
//.age{
//    font-weight:700;
//    color:#b91c1c;
//}
//
//.reason{
//    display:inline-block;
//    margin-left:10px;
//    padding:4px 10px;
//    border-radius:20px;
//    background:#fee2e2;
//    color:#991b1b;
//    font-size:12px;
//    font-weight:700;
//}
//
//.separator{
//    margin:36px 0;
//    border-top:1px solid #e5e7eb;
//}
//
//.note{
//    color:#6b7280;
//    font-size:14px;
//    line-height:1.7;
//}
//
//.footer{
//    border-top:1px solid #e5e7eb;
//    padding:24px 40px;
//    background:#fafafa;
//    color:#9ca3af;
//    font-size:12px;
//    line-height:1.7;
//}
//
//.footer strong{
//    color:#374151;
//}
//
//</style>
//
//</head>
//
//<body>
//
//<div class="container">
//
//<div class="top-bar"></div>
//
//<div class="content">
//
//<div class="logo">
//Enda Tamweel
//</div>
//
//<div class="subtitle">
//Système de gestion des demandes de crédit
//</div>
//
//<div class="badge">
//ALERTE D'ÉLIGIBILITÉ
//</div>
//
//<div class="title">
//Client hors tranche d'âge
//</div>
//
//<div class="description">
//Une demande de crédit a été analysée automatiquement. Le contrôle d'éligibilité a détecté que l'âge du client ne respecte pas les critères définis par la politique d'octroi. Une vérification est recommandée avant toute poursuite du traitement.
//</div>
//
//<div class="card">
//
//<div class="row">
//<div class="label">Nom et prénom</div>
//<div class="value">{{NOM}}</div>
//</div>
//
//<div class="row">
//<div class="label">CIN</div>
//<div class="value">{{CIN}}</div>
//</div>
//
//<div class="row">
//<div class="label">Âge</div>
//<div class="value">
//<span class="age">{{AGE}} ans</span>
//<span class="reason">{{RAISON}}</span>
//</div>
//</div>
//
//</div>
//
//<div class="separator"></div>
//
//<div class="note">
//Cette notification est générée automatiquement par le moteur de contrôle d'éligibilité d'Enda Tamweel. Aucun traitement manuel n'est requis si cette alerte a déjà été prise en compte.
//</div>
//
//</div>
//
//<div class="footer">
//
//<strong>Enda Tamweel</strong><br>
//Plateforme de gestion des demandes de crédit<br>
//Message automatique — Merci de ne pas répondre à cet e-mail.
//
//</div>
//
//</div>
//
//</body>
//</html>
//""";
//
//        return template
//                .replace("{{NOM}}", nomPrenom)
//                .replace("{{CIN}}", cin)
//                .replace("{{AGE}}", String.valueOf(age))
//                .replace("{{RAISON}}", raison);
//    }
//
//}